import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
];

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  return 'document';
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '지원되지 않는 파일 타입입니다.' },
        { status: 400 }
      );
    }

    // 업로드 디렉토리 생성
    await mkdir(UPLOAD_DIR, { recursive: true });

    // 파일명 생성
    const fileId = randomUUID();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 파일 메타데이터 생성
    const fileType = getFileType(file.type);
    const attachmentMetadata = {
      id: fileId,
      type: fileType,
      url: `/uploads/${fileName}`,
      filename: file.name,
      size: file.size,
      mimeType: file.type
    };

    return NextResponse.json({
      success: true,
      attachment: attachmentMetadata
    });

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
