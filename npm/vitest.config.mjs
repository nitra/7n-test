import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // vitest 4: заміна видаленого all:true — без include у звіті лише імпортовані файли
      include: ['src/**/*.{js,mjs,ts,vue}'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '../coverage/npm'
    }
  }
})
