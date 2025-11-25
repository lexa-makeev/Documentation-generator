const fs = require('fs');
const path = require('path');
const { Document, Paragraph, TextRun, HeadingLevel, Alignment, Packer } = require('docx');

function cleanupOldDocumentation(outputFile) {
    try {
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
    } catch (error) {
    }
}

function getAllJsFiles(folderPath) {
    try {
        if (!fs.existsSync(folderPath)) {
            return [];
        }

        const stats = fs.statSync(folderPath);
        if (!stats.isDirectory()) {
            return [];
        }

        const files = fs.readdirSync(folderPath);
        let jsFiles = [];

        for (const file of files) {
            const fullPath = path.join(folderPath, file);
            
            try {
                const fileStats = fs.statSync(fullPath);

                if (fileStats.isDirectory()) {
                    const subFolderJsFiles = getAllJsFiles(fullPath);
                    jsFiles = jsFiles.concat(subFolderJsFiles);
                } else if (file.endsWith('.js') && 
                           file !== 'documentation-generator.js' && 
                           fileStats.isFile()) {
                    jsFiles.push(fullPath);
                }
            } catch (error) {
                continue;
            }
        }
        
        return jsFiles;
    } catch (error) {
        return [];
    }
}

function parseJavaScriptFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const functionPattern = /(\/\*\*[\s\S]*?\*\/)\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\s*\([^)]*\)\s*=>|class\s+(\w+))/g;
        
        const functions = [];
        let match;

        while ((match = functionPattern.exec(content)) !== null) {
            const jsDoc = match[1];
            const functionName = match[2] || match[3] || match[4];
            
            if (functionName && jsDoc) {
                const cleanJsDoc = jsDoc
                    .replace(/^\/\*\*|\*\/$/g, '')
                    .replace(/^\s*\*\s?/gm, '')
                    .trim();

                functions.push({
                    name: functionName,
                    jsDoc: cleanJsDoc
                });
            }
        }

        return {
            filePath: filePath,
            functions: functions
        };

    } catch (error) {
        return {
            filePath: filePath,
            functions: []
        };
    }
}

function extractParametersFromJsDoc(jsDoc) {
    const parameters = [];
    const lines = jsDoc.split('\n');
    
    for (let line of lines) {
        if (line.includes('@param')) {
            const match1 = line.match(/@param\s+\{([^}]+)\}\s+([^\s-]+)\s*-\s*(.+)/);
            const match2 = line.match(/@param\s+\{([^}]+)\}\s+([^\s]+)/);
            const match3 = line.match(/@param\s+([^\s]+)\s*-\s*(.+)/);
            
            if (match1) {
                parameters.push({
                    type: match1[1].trim(),
                    name: match1[2].trim(),
                    description: match1[3].trim()
                });
            } else if (match2) {
                parameters.push({
                    type: match2[1].trim(),
                    name: match2[2].trim(),
                    description: 'Описание отсутствует'
                });
            } else if (match3) {
                parameters.push({
                    type: 'any',
                    name: match3[1].trim(),
                    description: match3[2].trim()
                });
            }
        }
    }
    
    return parameters;
}

function extractReturnFromJsDoc(jsDoc) {
    const lines = jsDoc.split('\n');
    
    for (let line of lines) {
        if (line.includes('@return') || line.includes('@returns')) {
            const match = line.match(/@returns?\s+\{([^}]+)\}\s*(.+)/);
            if (match) {
                return {
                    type: match[1].trim(),
                    description: match[2].trim()
                };
            }
        }
    }
    
    return null;
}

function extractDescriptionFromJsDoc(jsDoc) {
    const lines = jsDoc.split('\n');
    const descriptionLines = [];
    
    for (let line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('@')) {
            break;
        }
        if (trimmedLine || descriptionLines.length > 0) {
            descriptionLines.push(trimmedLine);
        }
    }
    
    return descriptionLines.filter(line => line).join(' ');
}

async function createWordDocument(filesData, outputFile) {
    const children = [];

    children.push(
        new Paragraph({
            text: "Документация проекта JS",
            heading: HeadingLevel.TITLE,
            alignment: Alignment.CENTER,
            spacing: { after: 400 }
        }),
        new Paragraph({
            text: `Сгенерировано: ${new Date().toLocaleString('ru-RU')}`,
            spacing: { after: 200 }
        }),
        new Paragraph({
            text: "Автор: Макеев",
            spacing: { after: 200 }
        }),
        new Paragraph({
            text: "Версия: 1.0",
            spacing: { after: 400 }
        }),
        new Paragraph({
            text: "",
            pageBreakBefore: true
        }),
        new Paragraph({
            text: "Оглавление",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 }
        }),
        new Paragraph({
            text: "1. Введение",
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: "2. Документация файлов",
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: "3. Документация методов",
            spacing: { after: 400 }
        }),
        new Paragraph({
            text: "1. Введение",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 300 }
        }),
        new Paragraph({
            text: "Документ содержит автоматически сгенерированную документацию для проекта Node.js. Документация включает JSDoc описания и документацию функций, извлеченные непосредственно из исходного кода.",
            spacing: { after: 200 }
        })
    );

    children.push(
        new Paragraph({
            text: "2. Документация файлов",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 300 }
        })
    );

    filesData.forEach(fileData => {
        if (fileData.functions.length > 0) {
            children.push(
                new Paragraph({
                    text: `Файл: ${fileData.filePath}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 200 }
                }),
                new Paragraph({
                    text: `Количество функций: ${fileData.functions.length}`,
                    spacing: { after: 200 }
                })
            );
        }
    });

    children.push(
        new Paragraph({
            text: "3. Документация методов",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 300 }
        })
    );

    filesData.forEach(fileData => {
        if (fileData.functions.length > 0) {
            children.push(
                new Paragraph({
                    text: `Файл: ${fileData.filePath}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 200 }
                })
            );

            fileData.functions.forEach((func, index) => {
                const description = extractDescriptionFromJsDoc(func.jsDoc);
                const parameters = extractParametersFromJsDoc(func.jsDoc);
                const returnInfo = extractReturnFromJsDoc(func.jsDoc);
                
                children.push(
                    new Paragraph({
                        text: `Функция: ${func.name}`,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 100, after: 100 }
                    })
                );

                if (description) {
                    children.push(
                        new Paragraph({
                            text: "Описание:",
                            bold: true,
                            spacing: { after: 50 }
                        }),
                        new Paragraph({
                            text: description,
                            spacing: { after: 100 }
                        })
                    );
                }

                if (parameters.length > 0) {
                    children.push(
                        new Paragraph({
                            text: "Параметры:",
                            bold: true,
                            spacing: { after: 50 }
                        })
                    );

                    parameters.forEach(param => {
                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `• ${param.name} `, bold: true }),
                                    new TextRun(`(${param.type}) - ${param.description}`)
                                ],
                                spacing: { after: 30 }
                            })
                        );
                    });
                    children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
                }

                if (returnInfo) {
                    children.push(
                        new Paragraph({
                            text: "Возвращает:",
                            bold: true,
                            spacing: { after: 50 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${returnInfo.type} `, bold: true }),
                                new TextRun(`- ${returnInfo.description}`)
                            ],
                            spacing: { after: 100 }
                        })
                    );
                }

                if (index < fileData.functions.length - 1) {
                    children.push(
                        new Paragraph({
                            text: "─".repeat(50),
                            alignment: Alignment.CENTER,
                            spacing: { before: 50, after: 100 }
                        })
                    );
                }
            });
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputFile, buffer);
}

async function generateDocumentation(folderPath = '.', outputFile = 'JS_Project_Documentation.docx') {
    cleanupOldDocumentation(outputFile);
    
    const jsFiles = getAllJsFiles(folderPath);
    
    if (jsFiles.length === 0) {
        console.log('JS файлы не найдены');
        return false;
    }
    
    const filesData = jsFiles.map(parseJavaScriptFile);
    await createWordDocument(filesData, outputFile);
    
    console.log('Документация сгенерирована');
    return true;
}

async function main() {
    const folderPath = process.argv[2] || '.';
    const success = await generateDocumentation(folderPath, 'JS_Project_Documentation.docx');
    
    if (!success) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}