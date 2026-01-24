import { Controller, Get, Post, Patch, Param, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { PdfService } from '../pdf/pdf.service';
import { SolanaService } from '../solana/solana.service';
import { FormattedContract } from './types';

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly pdfService: PdfService,
    private readonly solanaService: SolanaService,
  ) {}

  // 계약서 생성
  @Post()
  async create(
    @Body() dto: CreateContractDto,
  ): Promise<{ success: boolean; data: FormattedContract }> {
    const data: FormattedContract = await this.contractsService.create(dto);
    return { success: true, data };
  }

  // 계약서 조회
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: FormattedContract }> {
    const data: FormattedContract = await this.contractsService.findOne(id);
    return { success: true, data };
  }

  // 고용주 서명
  @Patch(':id/employer-sign')
  async employerSign(
    @Param('id') id: string,
    @Body() dto: SignContractDto,
  ): Promise<{ success: boolean; data: FormattedContract }> {
    const data: FormattedContract = await this.contractsService.employerSign(
      id,
      dto.signature,
    );
    return { success: true, data };
  }

  // 근로자 서명 + 블록체인 기록
  @Patch(':id/worker-sign')
  async workerSign(
    @Param('id') id: string,
    @Body() dto: SignContractDto,
  ): Promise<{ success: boolean; data: FormattedContract }> {
    // 1. 근로자 서명
    let contract: FormattedContract = await this.contractsService.workerSign(
      id,
      dto.signature,
    );

    // 2. 계약 데이터 해시 생성 (변하지 않는 필드 기반)
    const contractHash = this.pdfService.generateContractHash(contract);

    // 3. Solana에 해시 기록
    const solanaTxId = await this.solanaService.recordHash(contractHash);

    // 4. 계약 완료 처리
    contract = await this.contractsService.complete(id, contractHash, solanaTxId);

    return { success: true, data: contract };
  }

  // PDF 다운로드
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const contract: FormattedContract = await this.contractsService.findOne(id);
    const pdfBuffer = await this.pdfService.generatePdf(contract);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contract-${id}.pdf"`,
    });
    res.send(pdfBuffer);
  }

  // 블록체인 검증
  @Get(':id/verify')
  async verify(@Param('id') id: string) {
    const contract: FormattedContract = await this.contractsService.findOne(id);

    if (!contract.solanaTxId) {
      return {
        success: false,
        error: '블록체인에 기록되지 않은 계약서입니다.',
      };
    }

    // 1. 현재 DB 데이터로 계약 해시 계산 (변하지 않는 필드 기반)
    const currentHash = this.pdfService.generateContractHash(contract);

    // 3. 블록체인에 저장된 해시와 비교
    const { isValid, blockchainHash } = await this.solanaService.verifyTransaction(
      contract.solanaTxId,
      currentHash,
    );

    return {
      success: true,
      data: {
        isValid,
        currentHash,        // 현재 데이터 기반 해시
        blockchainHash,     // 블록체인에 저장된 해시
        originalHash: contract.pdfHash,  // DB에 저장된 원본 해시
        solanaTxId: contract.solanaTxId,
        explorerUrl: `https://solscan.io/tx/${contract.solanaTxId}`,
        message: isValid
          ? '✅ 계약서가 위변조되지 않았습니다.'
          : '❌ 계약서가 위변조되었습니다! 현재 데이터와 블록체인 기록이 일치하지 않습니다.',
      },
    };
  }
}
