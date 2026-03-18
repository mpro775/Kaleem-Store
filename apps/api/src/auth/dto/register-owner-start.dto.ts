import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsEmail } from 'class-validator';

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export class RegisterOwnerStartDto {
  @IsString({ message: 'الاسم الكامل مطلوب' })
  @MaxLength(120, { message: 'الاسم الكامل يجب ألا يتجاوز 120 حرفاً' })
  fullName!: string;

  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  email!: string;

  @IsString({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @MaxLength(72, { message: 'كلمة المرور يجب ألا تتجاوز 72 حرفاً' })
  password!: string;

  @IsString({ message: 'رقم هاتف المالك مطلوب' })
  @MaxLength(30, { message: 'رقم الهاتف طويل جداً' })
  @Matches(PHONE_REGEX, { message: 'رقم هاتف المالك غير صالح' })
  ownerPhone!: string;

  @IsString({ message: 'اسم المتجر مطلوب' })
  @MaxLength(120, { message: 'اسم المتجر يجب ألا يتجاوز 120 حرفاً' })
  storeName!: string;

  @IsString({ message: 'رابط المتجر مطلوب' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'رابط المتجر يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط',
  })
  @MaxLength(80, { message: 'رابط المتجر يجب ألا يتجاوز 80 حرفاً' })
  storeSlug!: string;

  @IsOptional()
  @IsString({ message: 'رقم هاتف المتجر غير صالح' })
  @MaxLength(30, { message: 'رقم هاتف المتجر طويل جداً' })
  @Matches(PHONE_REGEX, { message: 'رقم هاتف المتجر غير صالح' })
  storePhone?: string;
}
