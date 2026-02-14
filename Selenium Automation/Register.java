import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class signup {

    public static void main(String[] args) throws InterruptedException {

        WebDriver driver = new ChromeDriver();
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get("https://moviemania.pratham.codes/register");
        driver.manage().window().maximize();
        Thread.sleep(2000);

        // USERNAME
        WebElement username = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("[data-testid='username-input']")
                )
        );
        username.sendKeys("priyanshi_test2");
        Thread.sleep(2000);

        // EMAIL
        WebElement email = driver.findElement(
                By.cssSelector("[data-testid='email-input']")
        );
        email.sendKeys("testuser12345@gmail.com");
        Thread.sleep(2000);

        // PASSWORD
        WebElement password = driver.findElement(
                By.cssSelector("[data-testid='password-input']")
        );
        password.sendKeys("TestPass1@");
        Thread.sleep(2000);

        // CONFIRM PASSWORD
        WebElement confirmPassword = driver.findElement(
                By.cssSelector("[data-testid='confirm-password-input']")
        );
        confirmPassword.sendKeys("TestPass1@");
        Thread.sleep(2000);

        // SUBMIT BUTTON
        WebElement submitBtn = driver.findElement(
                By.cssSelector("[data-testid='submit-button']")
        );
        Thread.sleep(2000);
        submitBtn.click();

        // WAIT FOR REDIRECT TO DASHBOARD
        wait.until(ExpectedConditions.urlContains("/dashboard"));

        Thread.sleep(3000);
        driver.quit();
    }
}
