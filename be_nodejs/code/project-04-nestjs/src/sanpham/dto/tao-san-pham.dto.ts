import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class TaoSanPhamDto {
  @ApiProperty({ example: 'Tai nghe Zeta ANC' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  ten!: string;

  @ApiProperty({ example: 'tai-nghe-zeta-anc' })
  @Matches(/^[a-z0-9-]+$/, { message: 'Chỉ chữ thường, số và dấu gạch ngang' })
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  moTa?: string;

  @ApiProperty({ example: 1290000, description: 'Đơn vị: đồng (số nguyên)' })
  // Tiền là SỐ NGUYÊN, không bao giờ Float (buổi 18)
  @IsInt({ message: 'Giá phải là số nguyên (đơn vị: đồng)' })
  @Min(0)
  giaVND!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  tonKho?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  danhMucId!: number;
}

/**
 * PartialType — biến MỌI trường thành tuỳ chọn.
 *
 * ĐỐI CHIẾU BUỔI 11: ở zod ta gặp bẫy `.partial()` KHÔNG gỡ `.default()`.
 * Ở đây không có bẫy đó, vì giá trị mặc định được gán trong SERVICE
 * chứ không nằm trong schema. Kiến trúc khác nhau → bẫy khác nhau.
 */
export class SuaSanPhamDto extends PartialType(TaoSanPhamDto) {}

export class LocSanPhamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  danhMuc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tuKhoa?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  // Query string LUÔN là chuỗi → @Type ép về number.
  // Đây là việc mà z.coerce.number() làm ở buổi 11.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moiTrang: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conHang?: boolean;
}
