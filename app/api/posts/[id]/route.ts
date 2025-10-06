import { NextRequest, NextResponse } from 'next/server';
// PostStatus enum removed - using string type
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제된 게시글 처리
    if (post.status === 'DELETED') {
      return NextResponse.json(
        { message: '삭제된 게시글입니다.' },
        { status: 410 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('게시글 조회 실패:', error);
    return NextResponse.json(
      { message: '게시글을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const body = await request.json();
    const { title, content, category, tags } = body;

    // 필수 필드 검증
    if (!title || !content) {
      return NextResponse.json(
        { message: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 제목 길이 검증
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { message: '제목은 5자 이상 100자 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 내용 길이 검증
    if (content.length < 10) {
      return NextResponse.json(
        { message: '내용은 10자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 사용자 인증
    const user = await requireApiUser({}, { headers: request.headers });

    // 기존 게시글 조회
    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!existingPost) {
      return NextResponse.json(
        { message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (existingPost.authorId !== user.id) {
      return NextResponse.json(
        { message: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 삭제된 게시글 확인
    if (existingPost.status === 'DELETED') {
      return NextResponse.json(
        { message: '삭제된 게시글은 수정할 수 없습니다.' },
        { status: 410 }
      );
    }

    // 24시간 이내 수정 가능 확인
    const now = new Date();
    const postAge = now.getTime() - existingPost.createdAt.getTime();
    const hours24 = 24 * 60 * 60 * 1000;

    if (postAge > hours24 && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '게시글 작성 후 24시간 이내에만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 게시글 수정
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || existingPost.category,
        tags: tags || existingPost.tags,
        editedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('게시글 수정 실패:', error);
    return NextResponse.json(
      { message: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // 사용자 인증
    const user = await requireApiUser({}, { headers: request.headers });

    // 기존 게시글 조회
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    if (!existingPost) {
      return NextResponse.json(
        { message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (작성자 또는 관리자)
    if (existingPost.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 삭제된 게시글 확인
    if (existingPost.status === PostStatus.DELETED) {
      return NextResponse.json(
        { message: '이미 삭제된 게시글입니다.' },
        { status: 410 }
      );
    }

    // 댓글이 있는 경우 soft delete, 없는 경우 hard delete
    if (existingPost._count.comments > 0) {
      // Soft delete
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'DELETED',
          title: '[삭제된 게시글]',
          content: '이 게시글은 작성자에 의해 삭제되었습니다.'
        }
      });
    } else {
      // Hard delete
      await prisma.post.delete({
        where: { id: postId }
      });
    }

    return NextResponse.json({ message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    return NextResponse.json(
      { message: '게시글 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
