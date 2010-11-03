package ru.zencoding.eclipse.preferences;

import org.eclipse.core.runtime.Assert;
import org.eclipse.jface.preference.FieldEditor;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.DisposeEvent;
import org.eclipse.swt.events.DisposeListener;
import org.eclipse.swt.events.FocusAdapter;
import org.eclipse.swt.events.FocusEvent;
import org.eclipse.swt.events.KeyAdapter;
import org.eclipse.swt.events.KeyEvent;
import org.eclipse.swt.graphics.GC;
import org.eclipse.swt.graphics.Point;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.Spinner;
import org.eclipse.swt.widgets.Text;

public class SpinnerFieldEditor extends FieldEditor {
	private Spinner spinner;
	
	// The top-level control for the field editor.
	private Composite top;
	
	public SpinnerFieldEditor(String name, String labelText, Composite parent) {
		super(name, labelText, parent);
	}	
	@Override
	protected void adjustForNumColumns(int numColumns) {
		GridData gd = (GridData) spinner.getLayoutData();
        gd.horizontalSpan = numColumns - 1;
        gd.grabExcessHorizontalSpace = false;
	}

	@Override
	protected void doFillIntoGrid(Composite parent, int numColumns) {
		getLabelControl(parent);

        spinner = getTextControl(parent);
        GridData gd = new GridData();
        gd.horizontalSpan = numColumns - 1;
        if (widthInChars != UNLIMITED) {
            GC gc = new GC(spinner);
            try {
                Point extent = gc.textExtent("X");//$NON-NLS-1$
                gd.widthHint = widthInChars * extent.x;
            } finally {
                gc.dispose();
            }
        } else {
            gd.horizontalAlignment = GridData.FILL;
            gd.grabExcessHorizontalSpace = true;
        }
        spinner.setLayoutData(gd);

	}

	@Override
	protected void doLoad() {
		// TODO Auto-generated method stub

	}

	@Override
	protected void doLoadDefault() {
		// TODO Auto-generated method stub

	}

	@Override
	protected void doStore() {
		// TODO Auto-generated method stub

	}

	@Override
	public int getNumberOfControls() {
		// TODO Auto-generated method stub
		return 2;
	}
	
	/**
     * Returns this field editor's text control.
     * <p>
     * The control is created if it does not yet exist
     * </p>
     *
     * @param parent the parent
     * @return the text control
     */
    public Spinner getSpinnerControl(Composite parent) {
        if (spinner == null) {
            spinner = new Spinner(parent, SWT.SINGLE | SWT.BORDER);
            spinner.setFont(parent.getFont());
            switch (validateStrategy) {
            case VALIDATE_ON_KEY_STROKE:
                spinner.addKeyListener(new KeyAdapter() {

                    /* (non-Javadoc)
                     * @see org.eclipse.swt.events.KeyAdapter#keyReleased(org.eclipse.swt.events.KeyEvent)
                     */
                    public void keyReleased(KeyEvent e) {
                        valueChanged();
                    }
                });
                spinner.addFocusListener(new FocusAdapter() {
                	// Ensure that the value is checked on focus loss in case we
                	// missed a keyRelease or user hasn't released key.
                	// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=214716
                    public void focusLost(FocusEvent e) {
                        valueChanged();
                    }
                });
 

                break;
            case VALIDATE_ON_FOCUS_LOST:
                spinner.addKeyListener(new KeyAdapter() {
                    public void keyPressed(KeyEvent e) {
                        clearErrorMessage();
                    }
                });
                spinner.addFocusListener(new FocusAdapter() {
                    public void focusGained(FocusEvent e) {
                        refreshValidState();
                    }

                    public void focusLost(FocusEvent e) {
                        valueChanged();
                        clearErrorMessage();
                    }
                });
                break;
            default:
                Assert.isTrue(false, "Unknown validate strategy");//$NON-NLS-1$
            }
            spinner.addDisposeListener(new DisposeListener() {
                public void widgetDisposed(DisposeEvent event) {
                    spinner = null;
                }
            });
            if (textLimit > 0) {//Only set limits above 0 - see SWT spec
                spinner.setTextLimit(textLimit);
            }
        } else {
            checkParent(spinner, parent);
        }
        return spinner;
    }

}
