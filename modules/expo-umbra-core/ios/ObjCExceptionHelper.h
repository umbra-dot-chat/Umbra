#import <Foundation/Foundation.h>

/// Helper to catch ObjC exceptions from Swift.
/// Swift has no native @try/@catch for NSException, so we bridge through ObjC.
@interface ObjCExceptionHelper : NSObject

/// Execute a block and return any NSException thrown as an NSError.
/// Returns nil on success.
+ (nullable NSError *)tryCatch:(void (NS_NOESCAPE ^_Nonnull)(void))block;

@end
