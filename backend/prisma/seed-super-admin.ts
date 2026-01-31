import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@kimcontract.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'admin1234';

  // 이미 존재하는지 확인
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('슈퍼어드민이 이미 존재합니다:', email);
    return;
  }

  // 슈퍼어드민용 회사 생성 (시스템 회사)
  const company = await prisma.company.create({
    data: {
      name: 'KimContract System',
      ceoName: 'System',
      businessNumber: '000-00-00000',
      address: 'System',
      phone: '000-0000-0000',
      status: 'ACTIVE',
    },
  });

  // 슈퍼어드민 생성
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      companyId: company.id,
    },
  });

  console.log('슈퍼어드민 생성 완료!');
  console.log('이메일:', email);
  console.log('비밀번호:', password);
  console.log('User ID:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
