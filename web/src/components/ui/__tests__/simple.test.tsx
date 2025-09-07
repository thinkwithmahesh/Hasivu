/**
 * Simple Test to Verify Setup
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

describe('Simple Test', () => {
  it('verifies Jest and React Testing Library are working', () => {
    render(<div>Hello World</div>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})