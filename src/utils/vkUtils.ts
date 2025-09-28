import bridge from '@vkontakte/vk-bridge';

export interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100?: string;
  photo_200?: string;
}

class VKService {
  private isInitialized = false;
  private currentUser: VKUser | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Инициализация VK Bridge
      await bridge.send('VKWebAppInit');
      this.isInitialized = true;
      
      // Получение данных пользователя
      const userData = await bridge.send('VKWebAppGetUserInfo');
      this.currentUser = userData as VKUser;
      
      console.log('VK Bridge initialized, user:', this.currentUser);
    } catch (error) {
      console.warn('VK Bridge not available, using demo mode:', error);
      // Демо-режим для разработки
      this.currentUser = {
        id: 123456789,
        first_name: 'Тест',
        last_name: 'Пользователь',
        photo_100: ''
      };
      this.isInitialized = true;
    }
  }

  getCurrentUser(): VKUser | null {
    return this.currentUser;
  }

  getHeaders(): Record<string, string> {
    if (!this.currentUser) {
      throw new Error('VK user not initialized');
    }

    return {
      'x-vk-user-id': this.currentUser.id.toString(),
      'x-vk-user-data': JSON.stringify(this.currentUser),
      'Content-Type': 'application/json'
    };
  }

  isVKEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           (window.location.href.includes('vk.com') || 
            window.location.href.includes('vk-apps.com') ||
            window.location.search.includes('vk_'));
  }
}

export const vkService = new VKService();