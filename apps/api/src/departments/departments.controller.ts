import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard, Roles, RolesGuard } from '../auth/auth.guard';
import { DepartmentsService } from './departments.service';

class CreateDepartmentDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  /** 公开接口：注册时选择团队 */
  @Get()
  list() {
    return this.departments.list();
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('super_admin', 'supervisor')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto.name);
  }
}
