import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OperatorService } from './operator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateOperatorDto } from './dto/create-operator.dto';

@Controller('operators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @Post()
  async create(
    @Body() dto: CreateOperatorDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.operatorService.create(dto, req.user);
  }

  @Get()
  async findAll(@Req() req: { user: JwtPayload }) {
    return this.operatorService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.operatorService.findOne(id, req.user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateOperatorDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.operatorService.updateOperator(id, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.operatorService.remove(id, req.user);
  }
}
