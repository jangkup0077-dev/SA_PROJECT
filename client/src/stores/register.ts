import { defineStore } from 'pinia'

export const useRegisterStore = defineStore('register', {
    state: () => ({
        email: '',
        password: '',
        username: '',
        age: '' as number | '',
        bio: '',
        selectedTags: [] as string[],
        photos: [] as File[],
    }),
    actions: {
        setCredentials(email: string, password: string) {
            this.email = email
            this.password = password
        },
        setProfile(username: string, age: number | '', bio: string) {
            this.username = username
            this.age = age
            this.bio = bio
        },
        toggleTag(tag: string) {
            const index = this.selectedTags.indexOf(tag)
            if (index > -1) {
                this.selectedTags.splice(index, 1)
            } else {
                this.selectedTags.push(tag)
            }
        },
        addPhoto(file: File) {
            if (this.photos.length < 4) {
                this.photos.push(file)
            }
        },
        removePhoto(index: number) {
            this.photos.splice(index, 1)
        },
        reset() {
            this.email = ''
            this.password = ''
            this.username = ''
            this.age = ''
            this.bio = ''
            this.selectedTags = []
            this.photos = []
        }
    }
})
