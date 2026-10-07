#!/usr/bin/env make

.DEFAULT_GOAL	:= default

TARGET		:= reconstruct-strings-web
SRCS		:= $(wildcard src/*.ts src/**/*.ts src/**/*.css static/*.html test/*.ts)

.PHONY: default
default: check build test ## Run the default pipeline

.PHONY: all
all: install check build test ## Run the full pipeline

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "Default goal: ${.DEFAULT_GOAL}"
	@awk 'BEGIN {FS = ":.*##"; \
		printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z_-]+:.*?##/ { \
		printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)

.PHONY: install
install: package.json ## Install npm dependencies
	@echo install ...
	@npm install

.PHONY: check
check: typecheck lint ## Run static checks

.PHONY: lint
lint: $(SRCS) ## Validate source code with ESLint
	@echo lint ...
	@npm run lint

.PHONY: typecheck
typecheck: $(SRCS) ## Validate TypeScript types
	@echo typecheck ...
	@npm run typecheck

.PHONY: build
build: $(SRCS) ## Build project bundle
	@echo build ...
	@npm run build

.PHONY: serve
serve: build ## Serve the application locally
	@echo serve ...
	@npm run serve

.PHONY: test
test: ## Run test suite
	@echo test ...
	@npm run test

.PHONY: clean
clean: ## Clean build artifacts
	-$(RM) -r dist

.PHONY: cleanall
cleanall: clean ## Purge build artifacts and node_modules
	-$(RM) -r node_modules
