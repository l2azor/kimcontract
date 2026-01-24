import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { PdfModule } from '../pdf/pdf.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [PdfModule, SolanaModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
