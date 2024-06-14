import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  HttpException,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: Prisma.UserCreateInput) {
    return this.usersService.create(createUserDto);
  }
  @Post('email')
  @HttpCode(HttpStatus.OK)
  checkEmail(@Body() { email }: { email: string }) {
    return this.usersService.checkEmail(email);
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  async password(
    @Res({ passthrough: true }) resp: Response,
    @Body() { password, userId }: { password: string; userId: number },
  ) {
    const result = await this.usersService.checkPassword(password, userId);
    resp.cookie('token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    return result;
  }

  @Get('user-details')
  @HttpCode(HttpStatus.OK)
  async userDetails(@Req() req: Request) {
    return this.usersService.getUserDetails(req);
  }

  @Get('log-out')
  @HttpCode(HttpStatus.OK)
  logOut(@Res({ passthrough: true }) resp: Response) {
    try {
      resp.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      return { message: 'session out', success: true };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('update-user')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Body() updateUserDto: Prisma.UserUpdateInput,
    @Req() req: Request,
  ) {
    return this.usersService.updateUser(updateUserDto, req);
  }

  @Get('search-user')
  @HttpCode(HttpStatus.OK)
  async searchUser(@Query('search') search: string) {
    return this.usersService.searchUser(search);
  }
}
