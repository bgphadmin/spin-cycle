"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"

const TenantButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children = "Add Tenant", ...props }, ref) => {
        return (
            <Button ref={ref} type="button" className={className} variant="default" size="default" {...props}>
                {children}
            </Button>
        )
    }
)

TenantButton.displayName = "TenantButton"

export default TenantButton
