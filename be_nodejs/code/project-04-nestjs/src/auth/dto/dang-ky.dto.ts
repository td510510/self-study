import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Buổi 32 — DTO (Data Transfer Object).
 *
 * SO VỚI ZOD (buổi 11):
 *   zod    : schema là GIÁ TRỊ  →  const s = z.object({...})
 *   Nest   : schema là LỚP + decorator  →  class Dto { @IsEmail() email: string }
 *
 * Lợi ích của cách Nest:
 *   1. Cùng một class vừa là KIỂU TypeScript, vừa là LUẬT VALIDATE
 *   2. @ApiProperty sinh luôn tài liệu Swagger (buổi 39)
 *   3. Không phải viết z.infer<> để lấy kiểu
 *
 * Cái giá: cần decorator (metadata ở runtime), phải bật
 * emitDecoratorMetadata trong tsconfig.
 */
export class DangKyDto {
  @ApiProperty({ example: 'khach@shop.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(1, { message: 'Không được rỗng' })
  @MaxLength(100, { message: 'Tối đa 100 ký tự' })
  @Transform(({ value }: { value: string }) => value?.trim())
  ten!: string;

  @ApiProperty({ example: 'matkhau-du-dai', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Tối thiểu 8 ký tự' })
  @MaxLength(72, { message: 'Tối đa 72 ký tự (giới hạn của bcrypt)' })
  matKhau!: string;
}
