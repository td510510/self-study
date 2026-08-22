import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class DangNhapDto {
  @ApiProperty({ example: 'khach@shop.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'matkhau-du-dai' })
  @IsString()
  @MinLength(1, { message: 'Không được rỗng' })
  matKhau!: string;
}
