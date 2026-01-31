import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CompanyQueryDto, AllContractsQueryDto } from './dto/query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Get('companies')
  async getCompanies(@Query() query: CompanyQueryDto) {
    const result = await this.superAdminService.getCompanies(query);
    return { success: true, data: result };
  }

  @Get('contracts')
  async getAllContracts(@Query() query: AllContractsQueryDto) {
    const result = await this.superAdminService.getAllContracts(query);
    return { success: true, data: result };
  }

  @Get('stats')
  async getOverallStats() {
    const result = await this.superAdminService.getOverallStats();
    return { success: true, data: result };
  }
}
