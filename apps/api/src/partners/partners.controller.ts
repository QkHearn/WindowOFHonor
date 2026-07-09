import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PartnersService } from './partners.service';

@Controller()
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Get('users/me/partners')
  @UseGuards(AuthGuard)
  myPartners(@Req() req: { user: { id: string } }) {
    return this.partners.getPartners(req.user.id);
  }

  @Get('users/me/co-honor-network')
  @UseGuards(AuthGuard)
  myNetwork(@Req() req: { user: { id: string } }) {
    return this.partners.getNetwork(req.user.id);
  }

  @Get('users/:id/partners')
  getPartnersByUser(@Param('id') id: string) {
    return this.partners.getPartners(id);
  }
}
