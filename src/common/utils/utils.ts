import { UserDataDto } from '../dtos/user-data.dto';

export function getDataFromToken(token: string): UserDataDto {
  try {
    const data = JSON.parse(token);
    return data;
  } catch (error) {
    return null;
  }
}