import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = [
      { id: 'music', name: '음악', description: '음악 관련 프로젝트' },
      { id: 'art', name: '미술', description: '미술 및 시각 예술 프로젝트' },
      { id: 'film', name: '영화', description: '영화 및 영상 프로젝트' },
      { id: 'dance', name: '댄스', description: '댄스 및 무용 프로젝트' },
      { id: 'theater', name: '연극', description: '연극 및 공연 프로젝트' },
      { id: 'literature', name: '문학', description: '문학 및 출판 프로젝트' },
      { id: 'photography', name: '사진', description: '사진 및 이미지 프로젝트' },
      { id: 'design', name: '디자인', description: '디자인 및 그래픽 프로젝트' },
      { id: 'tech', name: '기술', description: '기술 및 개발 프로젝트' },
      { id: 'other', name: '기타', description: '기타 분야 프로젝트' }
    ];

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}