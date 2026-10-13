package com.mockrelay.api.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ProjectNotFoundException.class)
    public ProblemDetail handleProjectNotFound(ProjectNotFoundException exception) {
        return createProblem(
                HttpStatus.NOT_FOUND,
                "Project not found",
                exception.getMessage()
        );
    }

    @ExceptionHandler(ProjectKeyAlreadyExistsException.class)
    public ProblemDetail handleProjectKeyConflict(ProjectKeyAlreadyExistsException exception) {
        return createProblem(
                HttpStatus.CONFLICT,
                "Project key conflict",
                exception.getMessage()
        );
    }

    @ExceptionHandler(EndpointNotFoundException.class)
    public ProblemDetail handleEndpointNotFound(EndpointNotFoundException exception) {
        return createProblem(
                HttpStatus.NOT_FOUND,
                "Endpoint not found",
                exception.getMessage()
        );
    }

    @ExceptionHandler(EndpointRouteConflictException.class)
    public ProblemDetail handleEndpointRouteConflict(EndpointRouteConflictException exception) {
        return createProblem(
                HttpStatus.CONFLICT,
                "Endpoint route conflict",
                exception.getMessage()
        );
    }

    @ExceptionHandler(InvalidEndpointPathException.class)
    public ProblemDetail handleInvalidEndpointPath(InvalidEndpointPathException exception) {
        return createProblem(
                HttpStatus.BAD_REQUEST,
                "Invalid endpoint path",
                exception.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleRequestBodyValidation(MethodArgumentNotValidException exception) {
        List<ValidationError> errors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toValidationError)
                .toList();

        ProblemDetail problem = createProblem(
                HttpStatus.BAD_REQUEST,
                "Invalid request",
                "One or more request fields are invalid"
        );
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ProblemDetail handleMethodValidation(HandlerMethodValidationException exception) {
        List<ValidationError> errors = new ArrayList<>();

        exception.getParameterValidationResults().forEach(result -> {
            String parameterName = result.getMethodParameter().getParameterName();
            result.getResolvableErrors().stream()
                    .map(error -> new ValidationError(parameterName, getMessage(error)))
                    .forEach(errors::add);
        });

        exception.getCrossParameterValidationResults().stream()
                .map(error -> new ValidationError("request", getMessage(error)))
                .forEach(errors::add);

        ProblemDetail problem = createProblem(
                HttpStatus.BAD_REQUEST,
                "Invalid method argument",
                "One or more controller method arguments are invalid"
        );
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        String detail = "Invalid value for parameter: " + exception.getName();
        return createProblem(HttpStatus.BAD_REQUEST, "Invalid parameter", detail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadableMessage(HttpMessageNotReadableException exception) {
        return createProblem(
                HttpStatus.BAD_REQUEST,
                "Malformed request",
                "The request body contains malformed or unsupported JSON"
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        return createProblem(
                HttpStatus.CONFLICT,
                "Data conflict",
                "The request conflicts with existing data"
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpectedException(Exception exception) {
        log.error("Unhandled application error", exception);
        ProblemDetail problem = createProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error",
                "An unexpected error occurred"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }

    private ValidationError toValidationError(FieldError error) {
        return new ValidationError(error.getField(), getMessage(error));
    }

    private String getMessage(MessageSourceResolvable error) {
        return error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage();
    }

    private ProblemDetail createProblem(HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
