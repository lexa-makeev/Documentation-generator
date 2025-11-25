NODE = node
NPM = npm
DOC_FILE = JS_Project_Documentation.docx
SOURCE_DIR = game


all: install docs

install:
	@echo "Installing dependencies..."
	$(NPM) install
	@echo "Dependencies installed"

docs:
	@echo "Generating documentation from $(SOURCE_DIR) folder..."
	$(NODE) documentation-generator.js $(SOURCE_DIR)
	@echo "Documentation generated: $(DOC_FILE)"

.PHONY: all install docs