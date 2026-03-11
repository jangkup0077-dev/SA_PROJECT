import { defineStore } from 'pinia'

export const useRegisterStore = defineStore('register', {
    state: () => ({
        email: '',
        password: '',
        username: '',
        birth_date: '',
        country: '',
        bio: '',
        selectedTags: [] as string[],
        photos: [] as File[],
    }),
    actions: {
        setCredentials(email: string, password: string) {
            this.email = email
            this.password = password
        },
        setProfile(username: string, birth_date: string, bio: string, country: string) { 
            this.username = username
            this.birth_date = birth_date
            this.bio = bio
            this.country = country
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
            this.birth_date = ''
            this.country = ''
            this.bio = ''
            this.selectedTags = []
            this.photos = []
        }
    }
})
