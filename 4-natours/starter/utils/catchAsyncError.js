// Our goal is to put the trycatch at a higher level, so we won't do it in every handler
// But why does catchAsyncError receives a function and RETURN A FUNCTION?
// Because we don't want the handler CALL immediately after and app begins, so we return a function but not call it right away.
const catchAsyncError = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next); // Since promises (fn is an asynchronous func, which will return a promise) automatically catch both synchronous errors and rejected promises, you can simply provide next as the final catch handler and Express will catch errors, because the catch handler is given the error as the first argument.
};

module.exports = catchAsyncError;
