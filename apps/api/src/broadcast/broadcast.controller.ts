import { Controller, Get } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';

@Controller('broadcast')
export class BroadcastController {
  constructor(private readonly broadcast: BroadcastService) {}

  @Get('honors')
  honors() {
    return this.broadcast.getHonors();
  }
}
