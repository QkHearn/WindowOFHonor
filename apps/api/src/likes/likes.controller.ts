import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { LikesService } from './likes.service';

class LikeDto {
  @IsUUID()
  toUserId!: string;

  @IsString()
  targetType!: string;

  @IsOptional()
  @IsUUID()
  targetId?: string;
}

@Controller('likes')
@UseGuards(AuthGuard)
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Post()
  like(@Req() req: { user: { id: string } }, @Body() dto: LikeDto) {
    return this.likes.like(req.user.id, dto);
  }
}
