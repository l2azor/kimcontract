import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import * as crypto from 'crypto';
import * as fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as path from 'path';
import { FormattedContract } from '../contracts/types';

@Injectable()
export class PdfService {
  private fontBytes: Buffer | null = null;
  private boldFontBytes: Buffer | null = null;
  private fontPath: string = '';

  constructor() {
    // 한글 폰트 로드 (나눔고딕 TTF 우선)
    const fontCandidates = [
      path.join(__dirname, 'fonts', 'NanumGothic.ttf'),
      path.join(__dirname, 'fonts', 'NanumGothic-Regular.ttf'),
      path.join(__dirname, 'fonts', 'NotoSansKR-Regular.ttf'),
    ];

    const boldFontCandidates = [
      path.join(__dirname, 'fonts', 'NanumGothic-Bold.ttf'),
      path.join(__dirname, 'fonts', 'NanumGothicBold.ttf'),
      path.join(__dirname, 'fonts', 'NotoSansKR-Bold.ttf'),
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

    for (const fontPath of boldFontCandidates) {
      try {
        if (fs.existsSync(fontPath)) {
          this.boldFontBytes = fs.readFileSync(fontPath);
          console.log('한글 Bold 폰트 로드 성공:', fontPath);
          break;
        }
      } catch (e) {
        console.warn('Bold 폰트 로드 실패:', fontPath, e);
      }
    }

    if (!this.fontBytes) {
      console.warn('한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.');
    }
  }

  // 요일 변환
  private convertWorkDays(days: string[]): string {
    return days.join(', ');
  }

  // 계약 유형 한글 변환
  private getContractTypeLabel(type: string): string {
    const map: Record<string, string> = {
      REGULAR: '정규직',
      PARTTIME: '단시간(파트타임)',
      DAILY: '일용직',
    };
    return map[type] || type;
  }

  // 테이블 행 그리기 헬퍼
  private drawTableRow(
    page: PDFPage,
    x: number,
    y: number,
    labelWidth: number,
    valueWidth: number,
    rowHeight: number,
    label: string,
    value: string,
    font: PDFFont,
    options?: { labelBg?: boolean; fontSize?: number },
  ) {
    const fontSize = options?.fontSize || 9;
    const labelBgColor = rgb(0.95, 0.95, 0.95);

    // 라벨 배경
    if (options?.labelBg !== false) {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: labelWidth,
        height: rowHeight,
        color: labelBgColor,
      });
    }

    // 셀 테두리
    page.drawRectangle({
      x,
      y: y - rowHeight,
      width: labelWidth,
      height: rowHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5,
    });
    page.drawRectangle({
      x: x + labelWidth,
      y: y - rowHeight,
      width: valueWidth,
      height: rowHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5,
    });

    // 텍스트
    page.drawText(label, {
      x: x + 8,
      y: y - rowHeight + (rowHeight - fontSize) / 2,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(value, {
      x: x + labelWidth + 8,
      y: y - rowHeight + (rowHeight - fontSize) / 2,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    return y - rowHeight;
  }

  // PDF 생성
  async generatePdf(contract: FormattedContract): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    // fontkit 등록
    pdfDoc.registerFontkit(fontkit);

    // 한글 폰트 임베드
    let font: PDFFont;
    let boldFont: PDFFont;
    if (this.fontBytes) {
      try {
        font = await pdfDoc.embedFont(this.fontBytes);
        boldFont = this.boldFontBytes
          ? await pdfDoc.embedFont(this.boldFontBytes)
          : font;
      } catch (fontError) {
        console.error('폰트 임베딩 실패:', this.fontPath, fontError);
        const { StandardFonts } = await import('pdf-lib');
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        console.warn(
          '기본 폰트(Helvetica)로 대체합니다. 한글이 깨질 수 있습니다.',
        );
      }
    } else {
      const { StandardFonts } = await import('pdf-lib');
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      console.warn('한글 폰트 없음. 기본 폰트(Helvetica) 사용.');
    }

    const page = pdfDoc.addPage([595, 842]); // A4 사이즈
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - margin * 2;

    // 색상 정의
    const primaryColor = rgb(0.15, 0.3, 0.5);
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.85, 0.85, 0.85);

    let y = height - 40;

    // ===== 상단 헤더 영역 =====
    // 상단 라인
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 2,
      color: primaryColor,
    });
    y -= 5;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: primaryColor,
    });

    // 제목
    y -= 35;
    const title = '표 준 근 로 계 약 서';
    const titleWidth = boldFont.widthOfTextAtSize(title, 22);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y,
      size: 22,
      font: boldFont,
      color: primaryColor,
    });

    // 부제목 (계약 유형)
    y -= 22;
    const subtitle = `[ ${this.getContractTypeLabel(contract.contractType)} ]`;
    const subtitleWidth = font.widthOfTextAtSize(subtitle, 11);
    page.drawText(subtitle, {
      x: (width - subtitleWidth) / 2,
      y,
      size: 11,
      font,
      color: grayColor,
    });

    // 문서 번호 (우측 상단)
    const docNum = `문서번호: ${contract.id.substring(0, 8).toUpperCase()}`;
    page.drawText(docNum, {
      x: width - margin - font.widthOfTextAtSize(docNum, 8),
      y: height - 55,
      size: 8,
      font,
      color: grayColor,
    });

    y -= 25;

    // ===== 계약 당사자 정보 =====
    // 섹션 헤더
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: contentWidth,
      height: 18,
      color: primaryColor,
    });
    page.drawText('제1조 (계약 당사자)', {
      x: margin + 10,
      y: y - 13,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    y -= 18;

    // 고용주/근로자 2열 레이아웃
    const halfWidth = (contentWidth - 10) / 2;
    const labelW = 70;
    const valueW = halfWidth - labelW;
    const rowH = 22;

    // 고용주 정보 (좌측)
    y -= 5;
    let leftY = y;
    page.drawText('【 사 용 자 】', {
      x: margin + 10,
      y: leftY - 15,
      size: 9,
      font: boldFont,
      color: primaryColor,
    });
    leftY -= 20;

    leftY = this.drawTableRow(
      page,
      margin,
      leftY,
      labelW,
      valueW,
      rowH,
      '상 호 명',
      contract.employerName,
      font,
    );
    leftY = this.drawTableRow(
      page,
      margin,
      leftY,
      labelW,
      valueW,
      rowH,
      '대 표 자',
      contract.employerCeo,
      font,
    );
    leftY = this.drawTableRow(
      page,
      margin,
      leftY,
      labelW,
      valueW,
      rowH,
      '소 재 지',
      contract.employerAddress,
      font,
    );
    leftY = this.drawTableRow(
      page,
      margin,
      leftY,
      labelW,
      valueW,
      rowH,
      '연 락 처',
      contract.employerPhone,
      font,
    );

    // 근로자 정보 (우측)
    let rightY = y;
    const rightX = margin + halfWidth + 10;
    page.drawText('【 근 로 자 】', {
      x: rightX + 10,
      y: rightY - 15,
      size: 9,
      font: boldFont,
      color: primaryColor,
    });
    rightY -= 20;

    rightY = this.drawTableRow(
      page,
      rightX,
      rightY,
      labelW,
      valueW,
      rowH,
      '성    명',
      contract.workerName,
      font,
    );
    rightY = this.drawTableRow(
      page,
      rightX,
      rightY,
      labelW,
      valueW,
      rowH,
      '생년월일',
      contract.workerBirth,
      font,
    );
    rightY = this.drawTableRow(
      page,
      rightX,
      rightY,
      labelW,
      valueW,
      rowH,
      '주    소',
      contract.workerAddress,
      font,
    );
    rightY = this.drawTableRow(
      page,
      rightX,
      rightY,
      labelW,
      valueW,
      rowH,
      '연 락 처',
      contract.workerPhone,
      font,
    );

    y = Math.min(leftY, rightY) - 15;

    // ===== 근로 조건 =====
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: contentWidth,
      height: 18,
      color: primaryColor,
    });
    page.drawText('제2조 (근로조건)', {
      x: margin + 10,
      y: y - 13,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    y -= 18;

    const fullLabelW = 100;
    const fullValueW = contentWidth - fullLabelW;

    const startDate = new Date(contract.startDate).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const endDate = contract.endDate
      ? new Date(contract.endDate).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '정함이 없음';

    y = this.drawTableRow(
      page,
      margin,
      y,
      fullLabelW,
      fullValueW,
      rowH,
      '계 약 기 간',
      `${startDate}  ~  ${endDate}`,
      font,
    );

    const workDays = Array.isArray(contract.workDays)
      ? this.convertWorkDays(contract.workDays)
      : contract.workDays;
    y = this.drawTableRow(
      page,
      margin,
      y,
      fullLabelW,
      fullValueW,
      rowH,
      '근 무 요 일',
      `매주 ${workDays}`,
      font,
    );

    y = this.drawTableRow(
      page,
      margin,
      y,
      fullLabelW,
      fullValueW,
      rowH,
      '근 무 시 간',
      `${contract.workStart} ~ ${contract.workEnd} (휴게시간 ${contract.breakTime}분 제외)`,
      font,
    );

    y = this.drawTableRow(
      page,
      margin,
      y,
      fullLabelW,
      fullValueW,
      rowH,
      '시       급',
      `금 ${contract.hourlyWage.toLocaleString()}원 (매월 ${contract.payDay}일 지급)`,
      font,
    );

    y -= 15;

    // ===== 특약 사항 =====
    if (contract.specialTerms) {
      page.drawRectangle({
        x: margin,
        y: y - 18,
        width: contentWidth,
        height: 18,
        color: primaryColor,
      });
      page.drawText('제3조 (특약사항)', {
        x: margin + 10,
        y: y - 13,
        size: 10,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
      y -= 18;

      // 특약 사항 박스
      page.drawRectangle({
        x: margin,
        y: y - 45,
        width: contentWidth,
        height: 45,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
      });
      page.drawText(contract.specialTerms, {
        x: margin + 10,
        y: y - 28,
        size: 9,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 60;
    }

    // ===== 계약 문구 =====
    y -= 10;
    const agreementText =
      '위와 같이 근로계약을 체결하고, 이 계약서 2통을 작성하여 당사자가 각각 1통씩 보관한다.';
    const agreementWidth = font.widthOfTextAtSize(agreementText, 9);
    page.drawText(agreementText, {
      x: (width - agreementWidth) / 2,
      y,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // 계약일
    y -= 25;
    const contractDate = contract.signedAt
      ? new Date(contract.signedAt)
      : new Date();
    const dateStr = `${contractDate.getFullYear()}년 ${contractDate.getMonth() + 1}월 ${contractDate.getDate()}일`;
    const dateWidth = font.widthOfTextAtSize(dateStr, 12);
    page.drawText(dateStr, {
      x: (width - dateWidth) / 2,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= 35;

    // ===== 서명 영역 =====
    const signBoxWidth = 180;
    const signBoxHeight = 80;
    const signBoxY = y - signBoxHeight;

    // 사용자(고용주) 서명
    const employerSignX = margin + 30;
    page.drawRectangle({
      x: employerSignX,
      y: signBoxY,
      width: signBoxWidth,
      height: signBoxHeight,
      borderColor: lightGray,
      borderWidth: 1,
    });
    page.drawText('사 용 자', {
      x: employerSignX + signBoxWidth / 2 - 20,
      y: signBoxY + signBoxHeight - 15,
      size: 10,
      font: boldFont,
      color: primaryColor,
    });
    page.drawLine({
      start: { x: employerSignX + 10, y: signBoxY + signBoxHeight - 20 },
      end: { x: employerSignX + signBoxWidth - 10, y: signBoxY + signBoxHeight - 20 },
      thickness: 0.5,
      color: lightGray,
    });

    if (contract.employerSign) {
      try {
        const signData = contract.employerSign.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const signBuffer = Buffer.from(signData, 'base64');
        const signImage = await pdfDoc.embedPng(signBuffer);
        page.drawImage(signImage, {
          x: employerSignX + 40,
          y: signBoxY + 15,
          width: 100,
          height: 45,
        });
      } catch (_e) {
        page.drawText('(서명)', {
          x: employerSignX + signBoxWidth / 2 - 15,
          y: signBoxY + 35,
          size: 9,
          font,
          color: grayColor,
        });
      }
    }
    page.drawText(`${contract.employerCeo} (인)`, {
      x: employerSignX + signBoxWidth / 2 - 25,
      y: signBoxY + 5,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // 근로자 서명
    const workerSignX = width - margin - signBoxWidth - 30;
    page.drawRectangle({
      x: workerSignX,
      y: signBoxY,
      width: signBoxWidth,
      height: signBoxHeight,
      borderColor: lightGray,
      borderWidth: 1,
    });
    page.drawText('근 로 자', {
      x: workerSignX + signBoxWidth / 2 - 20,
      y: signBoxY + signBoxHeight - 15,
      size: 10,
      font: boldFont,
      color: primaryColor,
    });
    page.drawLine({
      start: { x: workerSignX + 10, y: signBoxY + signBoxHeight - 20 },
      end: { x: workerSignX + signBoxWidth - 10, y: signBoxY + signBoxHeight - 20 },
      thickness: 0.5,
      color: lightGray,
    });

    if (contract.workerSign) {
      try {
        const signData = contract.workerSign.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const signBuffer = Buffer.from(signData, 'base64');
        const signImage = await pdfDoc.embedPng(signBuffer);
        page.drawImage(signImage, {
          x: workerSignX + 40,
          y: signBoxY + 15,
          width: 100,
          height: 45,
        });
      } catch (_e) {
        page.drawText('(서명)', {
          x: workerSignX + signBoxWidth / 2 - 15,
          y: signBoxY + 35,
          size: 9,
          font,
          color: grayColor,
        });
      }
    }
    page.drawText(`${contract.workerName} (인)`, {
      x: workerSignX + signBoxWidth / 2 - 25,
      y: signBoxY + 5,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // ===== 블록체인 검증 정보 (하단) =====
    if (contract.solanaTxId) {
      const footerY = 75;

      // 구분선
      page.drawLine({
        start: { x: margin, y: footerY + 20 },
        end: { x: width - margin, y: footerY + 20 },
        thickness: 0.5,
        color: lightGray,
      });

      // 블록체인 검증 아이콘/텍스트
      page.drawText('🔗 블록체인 검증 정보 (Solana Mainnet)', {
        x: margin,
        y: footerY,
        size: 8,
        font: boldFont,
        color: rgb(0.3, 0.5, 0.3),
      });

      page.drawText(`계약 해시: ${contract.pdfHash || 'N/A'}`, {
        x: margin,
        y: footerY - 12,
        size: 7,
        font,
        color: grayColor,
      });

      page.drawText(`트랜잭션: ${contract.solanaTxId}`, {
        x: margin,
        y: footerY - 24,
        size: 7,
        font,
        color: grayColor,
      });

      const solscanUrl = `https://solscan.io/tx/${contract.solanaTxId}`;
      page.drawText(`검증: ${solscanUrl}`, {
        x: margin,
        y: footerY - 36,
        size: 6,
        font,
        color: rgb(0.2, 0.4, 0.7),
      });
    }

    // 하단 라인
    page.drawLine({
      start: { x: margin, y: 30 },
      end: { x: width - margin, y: 30 },
      thickness: 0.5,
      color: primaryColor,
    });
    page.drawLine({
      start: { x: margin, y: 28 },
      end: { x: width - margin, y: 28 },
      thickness: 2,
      color: primaryColor,
    });

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
