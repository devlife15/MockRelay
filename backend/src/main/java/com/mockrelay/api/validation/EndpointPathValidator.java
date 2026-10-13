package com.mockrelay.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class EndpointPathValidator implements ConstraintValidator<ValidEndpointPath, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || EndpointPathNormalizer.isValid(value);
    }
}
