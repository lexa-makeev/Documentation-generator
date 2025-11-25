// number-game.js
/**
 * NUMBER GAME APPLICATION
 * =======================
 * 
 * Это простая игра-угадайка, где игрок пытается угадать
 * случайное число от 1 до 10.
 * 
 * @author Makeev
 * @version 1.0
 * @date 2022
 */

const readline = require('readline');

/**
 * Создает интерфейс для чтения пользовательского ввода
 * @returns {object} readline интерфейс
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Генерирует случайное число в указанном диапазоне
 * @param {number} min - Минимальное число
 * @param {number} max - Максимальное число
 * @returns {number} Случайное целое число между min и max (включительно)
 */
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Запрашивает ввод пользователя и валидирует догадку
 * @param {object} rl - readline интерфейс
 * @param {number} minRange - Минимальное допустимое число
 * @param {number} maxRange - Максимальное допустимое число
 * @returns {Promise<number>} Promise с валидированной пользовательской догадкой
 */
function getUserGuess(rl, minRange, maxRange) {
    return new Promise((resolve) => {
        rl.question(`Введите вашу догадку (${minRange}-${maxRange}): `, (answer) => {
            const guess = parseInt(answer);
            
            if (isNaN(guess)) {
                console.log("Неверный ввод! Пожалуйста, введите число.");
                resolve(getUserGuess(rl, minRange, maxRange));
            } else if (guess < minRange || guess > maxRange) {
                console.log(`Введите число между ${minRange} и ${maxRange}.`);
                resolve(getUserGuess(rl, minRange, maxRange));
            } else {
                resolve(guess);
            }
        });
    });
}

/**
 * Сравнивает догадку пользователя с секретным числом
 * @param {number} userGuess - Число, предложенное пользователем
 * @param {number} secretNumber - Сгенерированное целевое число
 * @returns {boolean} True если догадка верная, иначе False
 */
function checkGuess(userGuess, secretNumber) {
    return userGuess === secretNumber;
}

/**
 * Выполняет один раунд игры-угадайки
 * @param {object} gameState - Текущее состояние игры
 * @param {object} rl - readline интерфейс
 */
async function playRound(gameState, rl) {
    console.log('\n' + '='.repeat(40));
    console.log('НОВЫЙ РАУНД ИГРЫ');
    console.log('='.repeat(40));
    
    // Генерируем секретное число
    const secretNumber = generateRandomNumber(gameState.minRange, gameState.maxRange);
    console.log(`Секретное число сгенерировано! (Между ${gameState.minRange} и ${gameState.maxRange})`);
    
    // Получаем догадку пользователя
    const userGuess = await getUserGuess(rl, gameState.minRange, gameState.maxRange);
    
    // Проверяем результат
    if (checkGuess(userGuess, secretNumber)) {
        console.log('🎉 Вы выиграли!');
        gameState.wins++;
    } else {
        console.log(`Вы проиграли! Число было ${secretNumber}. Попробуйте еще раз!`);
    }
    
    gameState.totalGames++;
}

/**
 * Показывает статистику игры пользователю
 * @param {object} gameState - Текущее состояние игры
 */
function displayStatistics(gameState) {
    console.log('\n' + '='.repeat(40));
    console.log('СТАТИСТИКА ИГРЫ');
    console.log('='.repeat(40));
    console.log(`Всего сыграно игр: ${gameState.totalGames}`);
    console.log(`Выиграно игр: ${gameState.wins}`);
    console.log(`Проиграно игр: ${gameState.totalGames - gameState.wins}`);
    
    if (gameState.totalGames > 0) {
        const winPercentage = (gameState.wins / gameState.totalGames) * 100;
        console.log(`Процент выигрышей: ${winPercentage.toFixed(1)}%`);
    } else {
        console.log('Процент выигрышей: 0%');
    }
}

/**
 * Инициализирует начальное состояние игры
 * @returns {object} Начальное состояние игры
 */
function initializeGameState() {
    return {
        minRange: 1,
        maxRange: 10,
        totalGames: 0,
        wins: 0
    };
}

/**
 * Показывает главное меню игры и обрабатывает выбор пользователя
 * @param {object} gameState - Текущее состояние игры
 * @param {object} rl - readline интерфейс
 */
async function showMenu(gameState, rl) {
    while (true) {
        console.log('\n' + '='.repeat(40));
        console.log('МЕНЮ ИГРЫ-УГАДАЙКИ');
        console.log('='.repeat(40));
        console.log('1. Новая игра');
        console.log('2. Посмотреть статистику');
        console.log('3. Выход');
        
        const choice = await new Promise((resolve) => {
            rl.question('Введите ваш выбор (1-3): ', resolve);
        });
        
        if (choice === '1') {
            await playRound(gameState, rl);
        } else if (choice === '2') {
            displayStatistics(gameState);
        } else if (choice === '3') {
            console.log('Спасибо за игру! До свидания!');
            rl.close();
            break;
        } else {
            console.log('Неверный выбор! Пожалуйста, введите 1, 2 или 3.');
        }
    }
}

/**
 * Главная функция для инициализации и запуска игры-угадайки
 */
async function main() {
    console.log('Добро пожаловать в игру-угадайку!');
    console.log('Попробуйте угадать секретное число от 1 до 10!');
    
    const gameState = initializeGameState();
    const rl = createReadlineInterface();
    
    await showMenu(gameState, rl);
}


if (require.main === module) {
    main();
}