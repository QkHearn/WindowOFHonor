import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { AuthGuard, Roles, RolesGuard } from '../auth/auth.guard';
import { AdminService } from './admin.service';

class ManageDepartmentsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds!: string[];
}

class TransferDepartmentDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds!: string[];

  @IsOptional()
  @IsUUID('4')
  departmentId?: string | null;
}

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Patch('users/department')
  transferDepartment(@Body() dto: TransferDepartmentDto) {
    return this.admin.transferUsersDepartment(dto.userIds, dto.departmentId ?? null);
  }

  @Post('users/:id/promote')
  promote(@Param('id') id: string, @Body() dto: ManageDepartmentsDto) {
    return this.admin.promoteToAdmin(id, dto.departmentIds);
  }

  @Post('users/:id/demote')
  demote(@Param('id') id: string) {
    return this.admin.demoteFromAdmin(id);
  }

  @Patch('users/:id/departments')
  updateDepartments(@Param('id') id: string, @Body() dto: ManageDepartmentsDto) {
    return this.admin.updateAdminDepartments(id, dto.departmentIds);
  }
}
