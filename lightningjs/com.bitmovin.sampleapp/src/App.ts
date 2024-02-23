import { Lightning, Utils } from '@lightningjs/sdk'

interface AppTemplateSpec extends Lightning.Component.TemplateSpec {
  Background: {
    Logo: object
    Mystery: object
    Text: object
  }
}

export class App
  extends Lightning.Component<AppTemplateSpec>
  implements Lightning.Component.ImplementTemplateSpec<AppTemplateSpec>
{
  /*
   * The following properties exist to make it more convenient to access elements
   * below in a type-safe way. They are optional.
   *
   * See https://lightningjs.io/docs/#/lightning-core-reference/TypeScript/Components/TemplateSpecs?id=using-a-template-spec
   * for more information.
   */
  readonly Background = this.getByRef('Background')!
  readonly Logo = this.Background.getByRef('Logo')!
  readonly Text = this.Background.getByRef('Text')!
  readonly Mystery = this.Background.getByRef('Mystery')!

  static override _template(): Lightning.Component.Template<AppTemplateSpec> {
    return {
      w: 1920,
      h: 1080,
      Background: {
        w: 1920,
        h: 1080,
        color: 0xfffbb03b,
        src: Utils.asset('images/background.png'),
        Logo: {
          mountX: 0.5,
          mountY: 1,
          x: 960,
          y: 600,
          src: Utils.asset('images/logo.png'),
        },
        Mystery: {
          x: 930,
          y: 400,
          w: 150,
          h: 150,
          scale: 0,
          src: Utils.asset('images/mystery.png'),
        },
        Text: {
          mount: 0.5,
          x: 960,
          y: 720,
          text: {
            text: "Let's start Building!",
            fontFace: 'Regular',
            fontSize: 64,
            textColor: 0xbbffffff,
          },
        },
      },
    }
  }

  static getFonts() {
    return [
      {
        family: 'Regular',
        url: Utils.asset('fonts/Roboto-Regular.ttf') as string,
      },
    ]
  }

  override _handleEnter() {
    this.Logo.setSmooth('scale', 2, {
      duration: 2.5,
    })
    this.Text.setSmooth('y', 800, {
      duration: 2.5,
    })
    this.Text.setSmooth('alpha', 0, {
      duration: 2.5,
      timingFunction: 'ease-out',
    })
    this.Mystery.smooth = {
      x: 1025,
      y: 550,
      scale: 1,
    }
  }

  override _init() {
    this.stage.transitions.defaultTransitionSettings.duration = 3
    this.Background.animation({
      duration: 15,
      repeat: -1,
      delay: 1,
      actions: [
        {
          p: 'color',
          v: {
            0: { v: 0xfffbb03b },
            0.5: { v: 0xfff46730 },
            0.8: { v: 0xfffbb03b },
          },
        },
      ],
    }).start()
  }
}
