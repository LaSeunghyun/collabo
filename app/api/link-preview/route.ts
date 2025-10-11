import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // URL 유효성 검증
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 URL입니다.' },
        { status: 400 }
      );
    }

    // 간단한 미리보기 데이터 생성 (실제로는 Open Graph API나 다른 서비스 사용)
    const linkPreview = {
      url,
      title: '링크 미리보기',
      description: '이 링크의 미리보기를 불러오는 중입니다...',
      image: null,
      siteName: new URL(url).hostname,
      domain: new URL(url).hostname
    };

    // 실제 구현에서는 여기서 Open Graph 데이터를 가져와야 합니다
    // 예: cheerio, puppeteer, 또는 외부 API 사용

    return NextResponse.json({
      success: true,
      preview: linkPreview
    });

  } catch (error) {
    console.error('링크 미리보기 오류:', error);
    return NextResponse.json(
      { error: '링크 미리보기를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
