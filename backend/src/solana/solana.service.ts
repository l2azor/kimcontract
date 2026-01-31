import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private connection: Connection;
  private payer: Keypair;

  constructor(private configService: ConfigService) {
    // Devnet 연결 (테스트용)
    this.connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );

    // 환경변수에서 개인키 로드
    const privateKey = this.configService.get<string>('SOLANA_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('SOLANA_PRIVATE_KEY 환경변수가 설정되지 않았습니다');
    }
    this.payer = Keypair.fromSecretKey(bs58.decode(privateKey));

    this.logger.log(
      `Solana Devnet 연결됨. Payer: ${this.payer.publicKey.toBase58()}`,
    );
  }

  // 해시를 Solana에 기록
  async recordHash(hash: string): Promise<string> {
    // 잔액 확인
    const balance = await this.connection.getBalance(this.payer.publicKey);
    const requiredBalance = 0.001 * LAMPORTS_PER_SOL; // 트랜잭션 수수료 여유분

    if (balance < requiredBalance) {
      const currentSOL = balance / LAMPORTS_PER_SOL;
      throw new Error(
        `SOL 잔액이 부족합니다. 현재: ${currentSOL.toFixed(6)} SOL, 필요: 최소 0.001 SOL. ` +
        `지갑 주소: ${this.payer.publicKey.toBase58()}`,
      );
    }

    // 메모 데이터 생성 (해시값을 메모로 저장)
    const memoData = Buffer.from(`KIMCONTRACT:${hash}`);

    // 트랜잭션 생성
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.payer.publicKey,
        toPubkey: this.payer.publicKey,
        lamports: 0,
      }),
    );

    // 메모 추가 (data 필드에 해시 저장)
    transaction.add({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: memoData,
    });

    // 트랜잭션 전송
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.payer],
    );

    this.logger.log(`Solana TX 기록 완료: ${signature}`);
    return signature;
  }

  // 트랜잭션 검증
  async verifyTransaction(
    txId: string,
    expectedHash: string,
  ): Promise<{ isValid: boolean; blockchainHash: string | null }> {
    try {
      const transaction = await this.connection.getTransaction(txId, {
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        this.logger.error('트랜잭션을 찾을 수 없습니다:', txId);
        return { isValid: false, blockchainHash: null };
      }

      // 메모 데이터에서 해시 추출
      const blockchainHash = this.extractHashFromTransaction(transaction);

      if (!blockchainHash) {
        this.logger.error('트랜잭션에서 해시를 추출할 수 없습니다');
        return { isValid: false, blockchainHash: null };
      }

      // 해시 비교
      const isValid = blockchainHash === expectedHash;

      this.logger.log(
        `검증 결과: ${isValid ? '일치' : '불일치'} (블록체인: ${blockchainHash.substring(0, 16)}..., 현재: ${expectedHash.substring(0, 16)}...)`,
      );

      return { isValid, blockchainHash };
    } catch (error) {
      this.logger.error('검증 실패:', error);
      return { isValid: false, blockchainHash: null };
    }
  }

  // 트랜잭션에서 메모 해시 추출
  private extractHashFromTransaction(transaction: any): string | null {
    try {
      const message = transaction.transaction.message;

      // 메모 프로그램 ID
      const memoProgramId = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

      // 계정 키 목록에서 메모 프로그램 인덱스 찾기
      const accountKeys = message.accountKeys || message.staticAccountKeys || [];
      const memoIndex = accountKeys.findIndex(
        (key: any) => key.toString() === memoProgramId,
      );

      this.logger.log(`메모 프로그램 인덱스: ${memoIndex}`);

      if (memoIndex === -1) {
        this.logger.error('메모 프로그램을 찾을 수 없습니다');
        return null;
      }

      // 명령어에서 메모 데이터 찾기
      const instructions = message.instructions || message.compiledInstructions || [];
      for (const ix of instructions) {
        const programIdIndex = ix.programIdIndex ?? ix.programIndex;
        if (programIdIndex === memoIndex) {
          // 메모 데이터 디코딩
          const data = ix.data;
          let memoText: string | null = null;

          this.logger.log(`메모 데이터 타입: ${typeof data}, 값: ${JSON.stringify(data).substring(0, 100)}`);

          if (typeof data === 'string') {
            // 먼저 base58로 시도 (Solana RPC 기본 형식)
            try {
              memoText = Buffer.from(bs58.decode(data)).toString('utf-8');
              this.logger.log(`base58 디코딩 결과: ${memoText}`);
            } catch {
              // base58 실패 시 base64로 시도
              try {
                memoText = Buffer.from(data, 'base64').toString('utf-8');
                this.logger.log(`base64 디코딩 결과: ${memoText}`);
              } catch {
                // 둘 다 실패하면 그냥 문자열로 사용
                memoText = data;
                this.logger.log(`디코딩 없이 원본 사용: ${memoText}`);
              }
            }
          } else if (Buffer.isBuffer(data)) {
            memoText = data.toString('utf-8');
          } else if (data instanceof Uint8Array) {
            memoText = Buffer.from(data).toString('utf-8');
          } else {
            continue;
          }

          // "KIMCONTRACT:{hash}" 형식에서 해시 추출
          if (memoText && memoText.startsWith('KIMCONTRACT:')) {
            const hash = memoText.replace('KIMCONTRACT:', '');
            this.logger.log(`추출된 해시: ${hash}`);
            return hash;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('메모 파싱 실패:', error);
      return null;
    }
  }
}
