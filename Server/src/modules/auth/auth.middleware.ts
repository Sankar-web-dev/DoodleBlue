import { NextFunction, Request, Response } from "express";
import User, { IUser, UserRole } from "./user.model";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Please log in to continue",
        },
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      req.session.destroy(() => {});

      res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Your session is invalid. Please log in again",
        },
      });
      return;
    }

    res.locals.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (
    _req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const user = res.locals.currentUser as IUser | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Please log in to continue",
        },
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });
      return;
    }

    next();
  };
}

export function requirePasswordChanged(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = res.locals.currentUser as IUser | undefined;

  if (user?.mustChangePassword) {
    res.status(403).json({
      success: false,
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "Change your password before accessing this resource",
      },
    });
    return;
  }

  next();
}