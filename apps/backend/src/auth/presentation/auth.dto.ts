import { IsDefined, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/presentation/validation';

export class RegisterDto {
  @IsDefined()
  @Trim()
  @IsString()
  @MaxLength(254)
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsDefined()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}

export class LoginDto {
  @IsDefined()
  @Trim()
  @IsString()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @MinLength(1)
  password: string;
}

export class RefreshDto {
  @IsDefined()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  refreshToken: string;
}
