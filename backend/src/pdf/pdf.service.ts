import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import * as crypto from 'crypto';
import * as fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as path from 'path';
import { FormattedContract } from '../contracts/types';

@Injectable()
export class PdfService {
  private fontBytes: Buffer | null = null;
  private fontPath: string = '';

  constructor() {
    // 한글 폰트 로드 (나눔고딕 TTF 우선)
    const fontCandidates = [
      path.join(__dirname, 'fonts', 'NanumGothic.ttf'),
      path.join(__dirname, 'fonts', 'NanumGothic-Regular.ttf'),
      path.join(__dirname, 'fonts', 'NotoSansKR-Regular.ttf'),
    ];

    for (const fontPath of fontCandidates) {
      try {
        if (fs.existsSync(fontPath)) {
          this.fontBytes = fs.readFileSync(fontPath);
          this.fontPath = fontPath;
          console.log('한글 폰트 로드 성공:', fontPath);
          break;
        }
      } catch (e) {
        console.warn('폰트 로드 실패:', fontPath, e);
      }
    }

    if (!this.fontBytes) {
      console.warn('한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.');
    }
  }

  // 요일 변환 (한글 -> 영문)
  private convertWorkDays(days: string[]): string {
    const dayMap: Record<string, string> = {
      월: '월',
      화: '화',
      수: '수',
      목: '목',
      금: '금',
      토: '토',
      일: '일',
    };
    return days.map((d) => dayMap[d] || d).join(', ');
  }

  // 계약 유형 한글 변환
  private getContractTypeLabel(type: string): string {
    const map: Record<string, string> = {
      REGULAR: '정규직',
      PARTTIME: '파트타임',
      DAILY: '일용직',
    };
    return map[type] || type;
  }

  // PDF 생성
  async generatePdf(contract: FormattedContract): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    // fontkit 등록
    pdfDoc.registerFontkit(fontkit);

    // 한글 폰트 임베드
    let font: PDFFont;
    if (this.fontBytes) {
      try {
        font = await pdfDoc.embedFont(this.fontBytes);
      } catch (fontError) {
        console.error('폰트 임베딩 실패:', this.fontPath, fontError);
        // 폰트 임베딩 실패 시 기본 폰트로 폴백
        const { StandardFonts } = await import('pdf-lib');
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        console.warn('기본 폰트(Helvetica)로 대체합니다. 한글이 깨질 수 있습니다.');
      }
    } else {
      // 폰트가 없으면 기본 폰트 사용 (한글 깨짐)
      const { StandardFonts } = await import('pdf-lib');
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      console.warn('한글 폰트 없음. 기본 폰트(Helvetica) 사용.');
    }

    const page = pdfDoc.addPage([595, 842]); // A4 사이즈
    const { width, height } = page.getSize();

    let y = height - 50;
    const lineHeight = 22;
    const margin = 50;
    const fontSize = 11;
    const titleSize = 18;
    const sectionSize = 13;

    // 제목
    page.drawText('표준 근로계약서', {
      x: width / 2 - 70,
      y,
      size: titleSize,
      font,
    });
    y -= lineHeight * 2;

    // 계약 유형
    page.drawText(
      `계약 유형: ${this.getContractTypeLabel(contract.contractType)}`,
      {
        x: margin,
        y,
        size: fontSize,
        font,
      },
    );
    y -= lineHeight * 1.5;

    // 고용주 정보
    page.drawText('[ 고용주 정보 ]', {
      x: margin,
      y,
      size: sectionSize,
      font,
    });
    y -= lineHeight;

    page.drawText(`상호명: ${contract.employerName}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;
    page.drawText(`대표자명: ${contract.employerCeo}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;
    page.drawText(`사업장 주소: ${contract.employerAddress}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;
    page.drawText(`연락처: ${contract.employerPhone}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight * 1.5;

    // 근로자 정보
    page.drawText('[ 근로자 정보 ]', {
      x: margin,
      y,
      size: sectionSize,
      font,
    });
    y -= lineHeight;

    page.drawText(`이름: ${contract.workerName}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;
    page.drawText(`생년월일: ${contract.workerBirth}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;
    page.drawText(`연락처: ${contract.workerPhone}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;
    page.drawText(`주소: ${contract.workerAddress}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight * 1.5;

    // 근무 조건
    page.drawText('[ 근무 조건 ]', {
      x: margin,
      y,
      size: sectionSize,
      font,
    });
    y -= lineHeight;

    const startDate = new Date(contract.startDate).toLocaleDateString('ko-KR');
    const endDate = contract.endDate
      ? new Date(contract.endDate).toLocaleDateString('ko-KR')
      : '무기한';
    page.drawText(`계약 기간: ${startDate} ~ ${endDate}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;

    const workDays = Array.isArray(contract.workDays)
      ? this.convertWorkDays(contract.workDays)
      : contract.workDays;
    page.drawText(`근무 요일: ${workDays}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;

    page.drawText(`근무 시간: ${contract.workStart} ~ ${contract.workEnd}`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;

    page.drawText(`휴게 시간: ${contract.breakTime}분`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;

    page.drawText(`시급: ${contract.hourlyWage.toLocaleString()}원`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight;

    page.drawText(`급여 지급일: 매월 ${contract.payDay}일`, {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight * 1.5;

    // 특약 사항
    if (contract.specialTerms) {
      page.drawText('[ 특약 사항 ]', {
        x: margin,
        y,
        size: sectionSize,
        font,
      });
      y -= lineHeight;
      page.drawText(contract.specialTerms, {
        x: margin,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight * 1.5;
    }

    // 서명 영역
    page.drawText('[ 서명 ]', {
      x: margin,
      y,
      size: sectionSize,
      font,
    });
    y -= lineHeight * 1.5;

    // 서명 이미지 삽입
    const signY = y - 50;

    if (contract.employerSign) {
      try {
        const signData = contract.employerSign.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const signBuffer = Buffer.from(signData, 'base64');
        const signImage = await pdfDoc.embedPng(signBuffer);
        page.drawImage(signImage, {
          x: margin,
          y: signY,
          width: 100,
          height: 50,
        });
      } catch (_e) {
        page.drawText('[고용주 서명]', {
          x: margin,
          y: signY + 20,
          size: 10,
          font,
        });
      }
    } else {
      page.drawText('[고용주 서명]', {
        x: margin,
        y: signY + 20,
        size: 10,
        font,
      });
    }
    page.drawText('고용주', { x: margin + 30, y: signY - 15, size: 10, font });

    if (contract.workerSign) {
      try {
        const signData = contract.workerSign.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const signBuffer = Buffer.from(signData, 'base64');
        const signImage = await pdfDoc.embedPng(signBuffer);
        page.drawImage(signImage, {
          x: width / 2 + 50,
          y: signY,
          width: 100,
          height: 50,
        });
      } catch (_e) {
        page.drawText('[근로자 서명]', {
          x: width / 2 + 50,
          y: signY + 20,
          size: 10,
          font,
        });
      }
    } else {
      page.drawText('[근로자 서명]', {
        x: width / 2 + 50,
        y: signY + 20,
        size: 10,
        font,
      });
    }
    page.drawText('근로자', {
      x: width / 2 + 80,
      y: signY - 15,
      size: 10,
      font,
    });

    // 서명일
    if (contract.signedAt) {
      const signedDate = new Date(contract.signedAt).toLocaleDateString(
        'ko-KR',
      );
      page.drawText(`서명일: ${signedDate}`, {
        x: width / 2 - 40,
        y: signY - 40,
        size: 10,
        font,
      });
    }

    // 블록체인 정보 (하단)
    if (contract.solanaTxId) {
      const solscanUrl = `https://solscan.io/tx/${contract.solanaTxId}`;

      page.drawText('[ 블록체인 검증 정보 ]', {
        x: margin,
        y: 100,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText('계약 해시:', {
        x: margin,
        y: 85,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(contract.pdfHash || 'N/A', {
        x: margin,
        y: 75,
        size: 6,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText('Solana TX:', {
        x: margin,
        y: 60,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(contract.solanaTxId, {
        x: margin,
        y: 50,
        size: 6,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText('검증 URL: ' + solscanUrl, {
        x: margin,
        y: 38,
        size: 6,
        font,
        color: rgb(0.2, 0.4, 0.8),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // SHA-256 해시 생성
  generateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // 계약 데이터 기반 해시 생성 (검증용, 변하지 않는 필드만 사용)
  generateContractHash(contract: FormattedContract): string {
    const hashData = {
      contractType: contract.contractType,
      employerName: contract.employerName,
      employerCeo: contract.employerCeo,
      employerAddress: contract.employerAddress,
      employerPhone: contract.employerPhone,
      workerName: contract.workerName,
      workerBirth: contract.workerBirth,
      workerPhone: contract.workerPhone,
      workerAddress: contract.workerAddress,
      startDate: contract.startDate,
      endDate: contract.endDate,
      workDays: contract.workDays,
      workStart: contract.workStart,
      workEnd: contract.workEnd,
      breakTime: contract.breakTime,
      hourlyWage: contract.hourlyWage,
      payDay: contract.payDay,
      specialTerms: contract.specialTerms,
      employerSign: contract.employerSign,
      workerSign: contract.workerSign,
      signedAt: contract.signedAt,
    };
    const jsonString = JSON.stringify(hashData, Object.keys(hashData).sort());
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }
}
