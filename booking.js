// Подключите проверенный HTTPS-обработчик музея для приёма заявок.
// Пустое значение оставляет форму в режиме подготовки текста без отправки данных.
const BOOKING_ENDPOINT = '';

const bookingForm = document.querySelector('#booking-form');
const bookingDate = bookingForm.elements.date;
const bookingStatus = document.querySelector('#booking-status');
const bookingPreview = document.querySelector('#booking-preview');
const bookingText = document.querySelector('#booking-text');
const bookingSubmit = bookingForm.querySelector('[type="submit"]');
const bookingMode = document.querySelector('#booking-mode');

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
bookingDate.min = localToday();
bookingDate.addEventListener('input', () => bookingDate.setCustomValidity(''));

if (BOOKING_ENDPOINT) {
  bookingMode.textContent = 'Отправка заявки не является подтверждением записи: музей свяжется с вами для согласования даты и времени.';
  bookingSubmit.textContent = 'Отправить заявку ↗';
}

bookingForm.addEventListener('input', () => {
  bookingPreview.hidden = true;
  bookingStatus.textContent = '';
});

bookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  bookingDate.min = localToday();
  if (bookingDate.value < bookingDate.min) {
    bookingDate.setCustomValidity('Выберите сегодняшнюю или более позднюю дату.');
    bookingDate.reportValidity();
    return;
  }
  bookingDate.setCustomValidity('');
  if (!bookingForm.reportValidity()) return;

  const values = Object.fromEntries(new FormData(bookingForm));
  const request = {
    type: values.type,
    program: values.program.trim(),
    date: values.date,
    time: values.time || '',
    participants: Number(values.participants),
    name: values.name.trim(),
    contact: values.contact.trim(),
    comment: (values.comment || '').trim()
  };

  if (!request.name || !request.program || !request.contact) {
    bookingStatus.textContent = 'Заполните название программы, имя и способ связи.';
    return;
  }
  if (!BOOKING_ENDPOINT) {
    bookingText.value = [
      'Заявка на посещение музея (черновик)',
      `Формат: ${request.type}`,
      `Программа или тема: ${request.program}`,
      `Желаемая дата: ${request.date}`,
      `Желаемое время: ${request.time || 'не указано'}`,
      `Количество участников: ${request.participants}`,
      `Имя: ${request.name}`,
      `Контакт: ${request.contact}`,
      `Комментарий: ${request.comment || 'нет'}`
    ].join('\n');
    bookingPreview.hidden = false;
    bookingStatus.textContent = 'Заявка подготовлена, но не отправлена. Скопируйте текст и передайте его музею через официальный канал связи, когда он будет опубликован.';
    bookingPreview.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  bookingSubmit.disabled = true;
  bookingStatus.textContent = 'Отправляем заявку…';
  try {
    const response = await fetch(BOOKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    bookingStatus.textContent = 'Заявка отправлена. Ожидайте подтверждения даты и времени от сотрудника музея.';
    bookingForm.reset();
  } catch {
    bookingStatus.textContent = 'Не удалось отправить заявку. Попробуйте позже или свяжитесь с музеем по указанным контактам.';
  } finally {
    bookingSubmit.disabled = false;
  }
});

document.querySelector('#booking-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(bookingText.value);
    bookingStatus.textContent = 'Текст скопирован. Заявка ещё не отправлена.';
  } catch {
    bookingText.focus();
    bookingText.select();
    bookingStatus.textContent = 'Текст выделен: скопируйте его сочетанием Ctrl+C. Заявка ещё не отправлена.';
  }
});
