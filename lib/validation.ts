// 프론트엔드 유효성 검사 (백엔드 ValidationPipe 없음)

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRequired(
  value: string | undefined | null,
  fieldName: string
): ValidationError | null {
  if (!value || value.trim() === "") {
    return { field: fieldName, message: `${fieldName}은(는) 필수 입력 항목입니다.` };
  }
  return null;
}

export function validateMaxLength(
  value: string | undefined | null,
  maxLength: number,
  fieldName: string
): ValidationError | null {
  if (value && value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName}은(는) ${maxLength}자를 초과할 수 없습니다.`,
    };
  }
  return null;
}

export function validateEmail(
  value: string | undefined | null,
  fieldName: string
): ValidationError | null {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { field: fieldName, message: "올바른 이메일 형식이 아닙니다." };
  }
  return null;
}

export function validatePositiveNumber(
  value: number | undefined | null,
  fieldName: string
): ValidationError | null {
  if (value === undefined || value === null || value <= 0) {
    return { field: fieldName, message: `${fieldName}은(는) 0보다 커야 합니다.` };
  }
  return null;
}

export function validateEndTimeAfterStartTime(
  startTime: string | Date,
  endTime: string | Date
): ValidationError | null {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    return {
      field: "end_time",
      message: "종료 시간은 시작 시간 이후여야 합니다.",
    };
  }
  return null;
}

export function validateFutureDate(
  value: string | Date,
  fieldName: string
): ValidationError | null {
  const date = new Date(value);
  const now = new Date();

  if (date < now) {
    return { field: fieldName, message: "과거 시간은 선택할 수 없습니다." };
  }
  return null;
}

// User 유효성 검사
export function validateUser(data: {
  name?: string;
  email?: string;
  department?: string;
  phone?: string;
  role?: string;
}, isCreate: boolean = true): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isCreate) {
    const nameRequired = validateRequired(data.name, "이름");
    if (nameRequired) errors.push(nameRequired);

    const emailRequired = validateRequired(data.email, "이메일");
    if (emailRequired) errors.push(emailRequired);
  }

  const nameLength = validateMaxLength(data.name, 50, "이름");
  if (nameLength) errors.push(nameLength);

  const emailLength = validateMaxLength(data.email, 100, "이메일");
  if (emailLength) errors.push(emailLength);

  const emailFormat = validateEmail(data.email, "이메일");
  if (emailFormat) errors.push(emailFormat);

  const deptLength = validateMaxLength(data.department, 100, "부서");
  if (deptLength) errors.push(deptLength);

  const phoneLength = validateMaxLength(data.phone, 20, "전화번호");
  if (phoneLength) errors.push(phoneLength);

  const roleLength = validateMaxLength(data.role, 20, "직책");
  if (roleLength) errors.push(roleLength);

  return errors;
}

// Admin 유효성 검사
export function validateAdmin(data: {
  name?: string;
  email?: string;
  department?: string;
}, isCreate: boolean = true): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isCreate) {
    const nameRequired = validateRequired(data.name, "이름");
    if (nameRequired) errors.push(nameRequired);

    const emailRequired = validateRequired(data.email, "이메일");
    if (emailRequired) errors.push(emailRequired);
  }

  const nameLength = validateMaxLength(data.name, 50, "이름");
  if (nameLength) errors.push(nameLength);

  const emailLength = validateMaxLength(data.email, 100, "이메일");
  if (emailLength) errors.push(emailLength);

  const emailFormat = validateEmail(data.email, "이메일");
  if (emailFormat) errors.push(emailFormat);

  const deptLength = validateMaxLength(data.department, 100, "부서");
  if (deptLength) errors.push(deptLength);

  return errors;
}

// MeetingRoom 유효성 검사
export function validateMeetingRoom(data: {
  room_name?: string;
  location?: string;
  capacity?: number;
  room_status?: string;
}, isCreate: boolean = true): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isCreate) {
    const nameRequired = validateRequired(data.room_name, "회의실 이름");
    if (nameRequired) errors.push(nameRequired);

    const locationRequired = validateRequired(data.location, "위치");
    if (locationRequired) errors.push(locationRequired);

    const capacityValid = validatePositiveNumber(data.capacity, "수용 인원");
    if (capacityValid) errors.push(capacityValid);
  }

  const nameLength = validateMaxLength(data.room_name, 100, "회의실 이름");
  if (nameLength) errors.push(nameLength);

  const locationLength = validateMaxLength(data.location, 100, "위치");
  if (locationLength) errors.push(locationLength);

  const statusLength = validateMaxLength(data.room_status, 20, "상태");
  if (statusLength) errors.push(statusLength);

  return errors;
}

// Equipment 유효성 검사
export function validateEquipment(data: {
  equipment_name?: string;
  quantity?: number;
}, isCreate: boolean = true): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isCreate) {
    const nameRequired = validateRequired(data.equipment_name, "장비 이름");
    if (nameRequired) errors.push(nameRequired);
  }

  const nameLength = validateMaxLength(data.equipment_name, 100, "장비 이름");
  if (nameLength) errors.push(nameLength);

  if (data.quantity !== undefined && data.quantity < 1) {
    errors.push({ field: "quantity", message: "수량은 1 이상이어야 합니다." });
  }

  return errors;
}

// Reservation 유효성 검사
export function validateReservation(data: {
  start_time?: string;
  end_time?: string;
  room_id?: number;
  purpose?: string;
}, isCreate: boolean = true): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isCreate) {
    const startRequired = validateRequired(data.start_time, "시작 시간");
    if (startRequired) errors.push(startRequired);

    const endRequired = validateRequired(data.end_time, "종료 시간");
    if (endRequired) errors.push(endRequired);

    if (!data.room_id) {
      errors.push({ field: "room_id", message: "회의실을 선택해 주세요." });
    }
  }

  if (data.start_time && data.end_time) {
    const timeOrder = validateEndTimeAfterStartTime(data.start_time, data.end_time);
    if (timeOrder) errors.push(timeOrder);
  }

  const purposeLength = validateMaxLength(data.purpose, 255, "목적");
  if (purposeLength) errors.push(purposeLength);

  return errors;
}
