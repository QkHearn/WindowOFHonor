import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { AuthGuard, Roles, RolesGuard } from '../auth/auth.guard';
import { DepartmentsService } from './departments.service';

class CreateDepartmentDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

class DeleteDepartmentDto {
  @IsOptional()
  @IsUUID('4')
  transferToDepartmentId?: string;
}

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  /** 公开接口：注册时选择组织 */
  @Get()
  list() {
    return this.departments.list();
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('super_admin')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto.name);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('super_admin')
  remove(
    @Param('id') id: string,
    @Query('transferTo') transferTo?: string,
    @Body() dto?: DeleteDepartmentDto,
  ) {
    const transferToDepartmentId = transferTo ?? dto?.transferToDepartmentId;
    return this.departments.remove(id, transferToDepartmentId);
  }
}
