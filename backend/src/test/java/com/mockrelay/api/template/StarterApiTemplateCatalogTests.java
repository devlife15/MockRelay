package com.mockrelay.api.template;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StarterApiTemplateCatalogTests {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StarterApiTemplateValidator templateValidator = new StarterApiTemplateValidator(
            Validation.buildDefaultValidatorFactory().getValidator()
    );
    private final StarterApiTemplateCatalog catalog = new StarterApiTemplateCatalog(
            new PathMatchingResourcePatternResolver(),
            objectMapper,
            templateValidator
    );

    @Test
    void discoversAndIndexesBuiltInTemplates() {
        catalog.load();

        assertThat(catalog.findAll())
                .extracting(template -> template.key())
                .containsExactly("loyalty-points", "users-api");
        assertThat(catalog.findByKey("loyalty-points"))
                .get()
                .satisfies(template -> {
                    assertThat(template.name()).isEqualTo("Loyalty Points");
                    assertThat(template.endpoints()).hasSize(7);
                });
        assertThat(catalog.findByKey("users-api"))
                .get()
                .satisfies(template -> {
                    assertThat(template.name()).isEqualTo("Users API");
                    assertThat(template.endpoints()).hasSize(3);
                });
        assertThat(catalog.findByKey("missing-template")).isEmpty();
    }

    @Test
    void rejectsDuplicateTemplateKeys() {
        Resource usersTemplate = new ClassPathResource("templates/v1/users-api.json");

        assertThatThrownBy(() -> catalog.loadDefinitions(new Resource[]{
                usersTemplate,
                usersTemplate
        }))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Duplicate starter API template key 'users-api'");
    }

    @Test
    void rejectsAnEmptyCatalogue() {
        assertThatThrownBy(() -> catalog.loadDefinitions(new Resource[0]))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No starter API templates matched");
    }
}
