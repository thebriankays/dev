'use client'

import React from 'react'
import { SplitText } from '@/components/SplitText'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useGSAP } from '@/providers/Animation'
import gsap from 'gsap'
import './demo.scss'

export function SplitTextDemo() {
  const heroRef = useScrollAnimation({
    animation: 'fadeUp',
    duration: 1.2,
    stagger: 0.1,
  })

  const parallaxRef = useScrollAnimation({
    animation: 'parallax',
    parallaxSpeed: 0.3,
  })

  return (
    <div className="split-text-demo">
      {/* Hero Section */}
      <section className="demo-hero">
        <div className="container">
          <h1 className="hero-title">
            <SplitText
              type="chars,words,lines"
              animation="rotateIn"
              stagger={0.02}
              duration={0.8}
            >
              Advanced Text Animations with GSAP & ScrollTrigger
            </SplitText>
          </h1>
          <p className="hero-subtitle">
            <SplitText
              type="words"
              animation="fadeUp"
              stagger={0.05}
              delay={0.5}
            >
              Experience the power of split text animations with smooth scrolling and WebGL integration
            </SplitText>
          </p>
        </div>
      </section>

      {/* Animation Types Section */}
      <section className="demo-section">
        <div className="container">
          <h2 className="section-title">
            <SplitText type="words" animation="slideIn" stagger={0.08}>
              Animation Types
            </SplitText>
          </h2>

          <div className="animation-grid">
            <div className="animation-card">
              <h3>
                <SplitText type="chars" animation="fadeUp">
                  Character Animation
                </SplitText>
              </h3>
              <p>
                <SplitText type="chars" animation="fadeIn" stagger={0.01}>
                  Each character animates individually for dramatic reveals
                </SplitText>
              </p>
            </div>

            <div className="animation-card">
              <h3>
                <SplitText type="words" animation="scaleIn">
                  Word Animation
                </SplitText>
              </h3>
              <p>
                <SplitText type="words" animation="fadeUp" stagger={0.05}>
                  Words animate separately creating a flowing effect
                </SplitText>
              </p>
            </div>

            <div className="animation-card">
              <h3>
                <SplitText type="lines" animation="slideIn">
                  Line Animation
                </SplitText>
              </h3>
              <p>
                <SplitText type="lines" animation="fadeUp" stagger={0.1}>
                  Lines animate together maintaining readability while adding visual interest
                </SplitText>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Animation Example */}
      <section className="demo-section dark">
        <div className="container">
          <h2>
            <SplitText
              type="words"
              customAnimation={(elements, gsap) => {
                const tl = gsap.timeline()
                elements.forEach((el, i) => {
                  tl.from(
                    el,
                    {
                      y: 100,
                      opacity: 0,
                      rotationX: -90,
                      transformPerspective: 1000,
                      duration: 1,
                      ease: 'back.out(2)',
                    },
                    i * 0.1
                  )
                })
                return tl
              }}
            >
              Custom Timeline Animation
            </SplitText>
          </h2>
          <p className="custom-text">
            <SplitText
              type="words,lines"
              customAnimation={(elements, gsap) => {
                const tl = gsap.timeline()
                gsap.set(elements, {
                  opacity: 0,
                  scale: 0,
                  y: 50,
                })
                tl.to(elements, {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  duration: 0.6,
                  stagger: {
                    each: 0.05,
                    from: 'random',
                  },
                  ease: 'elastic.out(1, 0.5)',
                })
                return tl
              }}
            >
              This demonstrates custom timeline animations with elastic easing and random stagger order
            </SplitText>
          </p>
        </div>
      </section>

      {/* Parallax Section */}
      <section className="demo-section parallax" ref={parallaxRef}>
        <div className="container">
          <div className="parallax-content">
            <h2 className="large-text">
              <SplitText
                type="chars"
                animation="scaleIn"
                stagger={0.02}
                duration={1.2}
              >
                PARALLAX
              </SplitText>
            </h2>
            <p>
              <SplitText
                type="words"
                animation="fadeUp"
                delay={0.5}
              >
                Combined with smooth scrolling and parallax effects
              </SplitText>
            </p>
          </div>
        </div>
      </section>

      {/* ScrollTrigger Scrub Example */}
      <section className="demo-section">
        <div className="container">
          <h2>
            <SplitText
              type="words"
              animation="fadeUp"
              scrollTriggerOptions={{
                scrub: 1,
                start: 'top 90%',
                end: 'top 50%',
              }}
            >
              Scrubbed Animation on Scroll
            </SplitText>
          </h2>
          <div className="scrub-demo">
            <p>
              <SplitText
                type="lines"
                animation="slideIn"
                scrollTriggerOptions={{
                  scrub: true,
                  start: 'top 80%',
                  end: 'top 20%',
                }}
              >
                This text animation is tied to the scroll position. 
                As you scroll, the animation progresses smoothly.
                Try scrolling up and down to see the effect!
              </SplitText>
            </p>
          </div>
        </div>
      </section>

      {/* Performance Notes */}
      <section className="demo-section notes">
        <div className="container">
          <h2>
            <SplitText type="words" animation="fadeUp">
              Performance Optimized
            </SplitText>
          </h2>
          <ul>
            <li>
              <SplitText type="words" animation="fadeUp" stagger={0.05}>
                Uses GSAP's hardware acceleration for smooth 60fps animations
              </SplitText>
            </li>
            <li>
              <SplitText type="words" animation="fadeUp" stagger={0.05} delay={0.2}>
                ScrollTrigger integration for efficient scroll-based animations
              </SplitText>
            </li>
            <li>
              <SplitText type="words" animation="fadeUp" stagger={0.05} delay={0.4}>
                Automatic cleanup prevents memory leaks
              </SplitText>
            </li>
            <li>
              <SplitText type="words" animation="fadeUp" stagger={0.05} delay={0.6}>
                Works seamlessly with Lenis smooth scrolling
              </SplitText>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}