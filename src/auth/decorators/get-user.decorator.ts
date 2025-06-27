import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('JWT decoded user:', request.user);

    if (!request.user) {
      console.error('No user in request!');
      return null;
    }

    return request.user;
  },
);

export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('JWT decoded user ID:', request.user?.id);

    if (!request.user || !request.user.id) {
      console.error('No user ID in request!');
      return null;
    }

    return request.user.id;
  },
);
