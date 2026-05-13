<template>
  <div class="contacts">
    <div class="container">
      <div class="card">
        <h1>📞 Контакты</h1>
        
        <div class="contact-info">
          <div class="info-row">
            <span class="label">📱 Телефон:</span>
            <span class="value">{{ contacts.phone || 'Не указан' }}</span>
          </div>
          <div class="info-row">
            <span class="label">📧 Email:</span>
            <span class="value">{{ contacts.email || 'Не указан' }}</span>
          </div>
          <div class="info-row">
            <span class="label">📍 Адрес:</span>
            <span class="value">{{ contacts.address || 'Не указан' }}</span>
          </div>
          <div class="info-row">
            <span class="label">🕐 Режим работы:</span>
            <span class="value">{{ contacts.work_hours || 'Не указан' }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Свяжитесь с нами</h2>
        <p>Если у вас есть вопросы по работе системы Music Manager, вы можете связаться с нами по указанным выше контактам.</p>
        <p class="note">Техническая поддержка отвечает в рабочие дни с 10:00 до 19:00 по московскому времени.</p>
      </div>

      <div v-if="isAdmin" class="card admin-card">
        <h2>✏️ Редактирование контактов</h2>
        <input v-model="editForm.phone" placeholder="Телефон" class="input-field">
        <input v-model="editForm.email" placeholder="Email" class="input-field">
        <input v-model="editForm.address" placeholder="Адрес" class="input-field">
        <input v-model="editForm.work_hours" placeholder="Режим работы" class="input-field">
        <button @click="updateContacts" class="btn-primary">Сохранить изменения</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ContactsView',
  data() {
    return {
      contacts: {},
      editForm: {
        phone: '',
        email: '',
        address: '',
        work_hours: ''
      },
      isAdmin: false
    }
  },
  mounted() {
    this.fetchContacts()
    this.isAdmin = localStorage.getItem('vue_admin_mode') === 'true'
  },
  methods: {
    async fetchContacts() {
      try {
        const response = await axios.get('/api/contacts')
        this.contacts = response.data
        this.editForm = { ...response.data }
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      }
    },
    async updateContacts() {
      try {
        await axios.put('/api/contacts', this.editForm)
        this.fetchContacts()
      } catch (error) {
        console.error('Ошибка обновления:', error)
      }
    }
  }
}
</script>

<style scoped>
.contacts {
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card h1, .card h2 {
  color: #a855f7;
  margin-bottom: 1rem;
}

.contact-info {
  margin-top: 1rem;
}

.info-row {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.label {
  width: 120px;
  color: #888;
}

.value {
  color: white;
  flex: 1;
}

.card p {
  color: #ccc;
  line-height: 1.6;
}

.note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(168, 85, 247, 0.1);
  border-radius: 12px;
  font-size: 0.9rem;
}

.admin-card {
  border-color: #a855f7;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
}
</style>