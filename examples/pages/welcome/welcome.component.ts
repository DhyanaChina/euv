import { Component } from '../../../src/index'
import { Logger } from '../../services/log.service'
// import template from './welcome.component.html'

@Component({
  components: [
    'login',
  ],
  template: `
  <div>
    <p>...</p>
    <login/>
  </div>
  `,
})
export class WelcomeComponent {
  
  propMessage: string
  
  constructor(
    private logger: Logger,
  ) {
  }
  
  mounted(): void {
    console.log('inject logger:', this.logger)
    this.greet()
  }
  
  greet(): void {
  }
  
}