const generateBtn = document.getElementById('generateBtn');
const lottoNumbersDiv = document.getElementById('lottoNumbers');

function generateLottoNumbers() {
  const numbers = new Set();
  while (numbers.size < 6) {
    const randomNumber = Math.floor(Math.random() * 45) + 1;
    numbers.add(randomNumber);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

function displayLottoNumbers(numbers) {
  lottoNumbersDiv.innerHTML = '';
  numbers.forEach(number => {
    const numberSpan = document.createElement('span');
    numberSpan.classList.add('number');
    numberSpan.textContent = number;
    lottoNumbersDiv.appendChild(numberSpan);
  });
}

generateBtn.addEventListener('click', () => {
  const lottoNumbers = generateLottoNumbers();
  displayLottoNumbers(lottoNumbers);
});