import { HttpInterceptorFn } from '@angular/common/http';

export const jsonInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: {
      Accept: 'application/json',
    },
  });
  return next(cloned);
};
