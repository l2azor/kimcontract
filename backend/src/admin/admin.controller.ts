import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ContractQueryDto, UpdateStatusDto } from './dto/contract-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('contracts')
  async getContracts(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ContractQueryDto,
  ) {
    const result = await this.adminService.getContracts(user.companyId, query);
    return { success: true, data: result };
  }

  @Get('contracts/:id')
  async getContractDetail(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const result = await this.adminService.getContractDetail(user.companyId, id);
    return { success: true, data: result };
  }

  @Patch('contracts/:id/status')
  async updateContractStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    const result = await this.adminService.updateContractStatus(user.companyId, id, dto);
    return { success: true, data: result };
  }

  @Delete('contracts/:id')
  async deleteContract(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const result = await this.adminService.deleteContract(user.companyId, id);
    return { success: true, data: result };
  }

  @Get('stats')
  async getStats(@CurrentUser() user: CurrentUserData) {
    const result = await this.adminService.getStats(user.companyId);
    return { success: true, data: result };
  }
}
