#import "ObjCExceptionHelper.h"

@implementation ObjCExceptionHelper

+ (nullable NSError *)tryCatch:(void (NS_NOESCAPE ^_Nonnull)(void))block {
    @try {
        block();
        return nil;
    } @catch (NSException *exception) {
        NSDictionary *userInfo = @{
            NSLocalizedDescriptionKey: exception.reason ?: @"Unknown ObjC exception",
            @"ExceptionName": exception.name ?: @"Unknown",
        };
        return [NSError errorWithDomain:@"ObjCException" code:-1 userInfo:userInfo];
    }
}

@end
